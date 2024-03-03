package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	pbcounter "github.com/alextebbs/counters/pb/counter/v1"
	pbevent "github.com/alextebbs/counters/pb/event/v1"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type counterServer struct {
	pbcounter.UnimplementedCounterServiceServer
	db *sql.DB
}

func (s *counterServer) Create(ctx context.Context, req *pbcounter.CounterServiceCreateRequest) (*pbcounter.CounterServiceCreateResponse, error) {
	// QUESTION: is this right? these things are just "" when not provided? I feel like
	// i'm used to seeing this as if req.Title == nil || req.EventTitle == nil
	if req.Title == "" || req.EventTitle == "" {
		return nil, fmt.Errorf("must provide title and event_title to create a counter")
	}

	var c pbcounter.Counter
	var t time.Time
	err := s.db.QueryRow(
		"INSERT INTO counters(title) VALUES($1) RETURNING id, title, count, timestamp",
		req.GetTitle()).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		log.Printf("Failed to insert counter into database: %v", err)
		return nil, err
	}

	_, err = s.db.Exec(
		"INSERT INTO events(title, counter_id) VALUES($1, $2)",
		req.GetEventTitle(), c.Id,
	)
	if err != nil {
		log.Printf("Failed to insert event into database: %v", err)
		return nil, err
	}

	c.Timestamp = timestamppb.New(t)
	return &pbcounter.CounterServiceCreateResponse{Counter: &c}, nil
}

func (s *counterServer) Get(ctx context.Context, req *pbcounter.CounterServiceGetRequest) (*pbcounter.CounterServiceGetResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("must provide id of counter to get")
	}

	var c pbcounter.Counter
	var t time.Time
	err := s.db.QueryRow("SELECT id, title, count, timestamp FROM counters WHERE id = $1", req.Id).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		log.Printf("Failed to get counter from database: %v", err)
		return nil, err
	}

	c.Timestamp = timestamppb.New(t)
	return &pbcounter.CounterServiceGetResponse{Counter: &c}, nil
}

func (s *counterServer) List(ctx context.Context, req *pbcounter.CounterServiceListRequest) (*pbcounter.CounterServiceListResponse, error) {
	var rows *sql.Rows
	var err error

	rows, err = s.db.Query("SELECT id, title, count, timestamp FROM counters")

	if err != nil {
		log.Printf("Failed to query database for counters: %v", err)
		return nil, err
	}
	defer rows.Close()

	var counters []*pbcounter.Counter
	for rows.Next() {
		var c pbcounter.Counter
		var t time.Time
		err := rows.Scan(&c.Id, &c.Title, &c.Count, &t)
		if err != nil {
			log.Printf("Failed to read row: %v", err)
			return nil, err
		}
		c.Timestamp = timestamppb.New(t)
		counters = append(counters, &c)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Failed during rows iteration: %v", err)
		return nil, err
	}

	return &pbcounter.CounterServiceListResponse{
		Counters: counters,
	}, nil
}

func (s *counterServer) Increment(ctx context.Context, req *pbcounter.CounterServiceIncrementRequest) (*pbcounter.CounterServiceIncrementResponse, error) {
	if req.Id == "" || req.Title == "" {
		return nil, fmt.Errorf("id and title must be provided")
	}

	tx, err := s.db.Begin()
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return nil, err
	}

	// 1. Find the last event's timestamp, the time between that and now will
	// become the duration of the new event
	var prevEventTimeStamp time.Time
	err = tx.QueryRow(`SELECT MAX(created_at) FROM events WHERE counter_id = $1`, req.Id).Scan(&prevEventTimeStamp)
	if err != nil && err != sql.ErrNoRows {
		tx.Rollback()
		log.Printf("Failed to retrieve last timestamp: %v", err)
		return nil, err
	}

	// 2. Increment the counter and get the new count and timestamp
	var c pbcounter.Counter
	var ct time.Time
	err = tx.QueryRow(
		"UPDATE counters SET count = count + 1, timestamp = NOW() WHERE id = $1 RETURNING id, title, count, timestamp",
		req.Id).Scan(&c.Id, &c.Title, &c.Count, &ct)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to update counter in database: %v", err)
		return nil, err
	}

	// 3. Add the new event with the calculated duration
	var e pbevent.Event
	var d time.Duration = time.Since(prevEventTimeStamp)
	var et time.Time
	err = tx.QueryRow(
		"INSERT INTO events(title, duration, counter_id) VALUES($1, $2, $3) RETURNING id, title, counter_id, created_at",
		req.Title, d, c.Id,
	).Scan(&e.Id, &e.Title, &e.CounterId, &et)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to add event to database: %v", err)
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		return nil, err
	}

	e.Duration = durationpb.New(d)
	e.CreatedAt = timestamppb.New(et)
	c.Timestamp = timestamppb.New(ct)
	return &pbcounter.CounterServiceIncrementResponse{
		Counter: &c,
		Event:   &e,
	}, nil
}

func (s *counterServer) Delete(ctx context.Context, req *pbcounter.CounterServiceDeleteRequest) (*pbcounter.CounterServiceDeleteResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("id must be provided to delete")
	}

	var c pbcounter.Counter
	err := s.db.QueryRow("DELETE FROM counters WHERE id = $1 RETURNING id", req.Id).Scan(&c.Id)
	if err != nil {
		log.Printf("Failed to delete counter from database: %v", err)
		return nil, err
	}

	return &pbcounter.CounterServiceDeleteResponse{Message: fmt.Sprintf("Deleted counter with id: %s", c.Id)}, nil
}
