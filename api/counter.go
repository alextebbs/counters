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

// Modify your server structs to include the Redis client
type counterServer struct {
	pbcounter.UnimplementedCounterServiceServer
	db    *sql.DB
	redis *RedisService
}

func (s *counterServer) Create(ctx context.Context, req *pbcounter.CounterServiceCreateRequest) (*pbcounter.CounterServiceCreateResponse, error) {
	// QUESTION: is this right? these things are just "" when not provided? I feel like
	// i'm used to seeing this as if req.Title == nil || req.EventTitle == nil
	if req.Title == "" || req.EventTitle == "" {
		return nil, fmt.Errorf("must provide title and event_title to create a counter")
	}

	var c pbcounter.Counter
	var t time.Time
	// first, insert into postgres
	err := s.db.QueryRow(
		"INSERT INTO counters(title) VALUES($1) RETURNING id, title, count, timestamp",
		req.GetTitle()).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		log.Printf("Failed to insert counter into database: %v", err)
		return nil, err
	}

	c.Timestamp = timestamppb.New(t)
	err = s.redis.Set(ctx, "counter", c.Id, &c, 0)
	if err != nil {
		log.Printf("Failed to cache counter in Redis: %v", err)
	}

	// now do the same for the event - note that the first event doesn't have a
	// duration - duration is a value on each event that actually refers to the
	// interval of time between the event and the previous event. There is no
	// previous event for the first event.
	var e pbevent.Event
	var et time.Time
	err = s.db.QueryRow(
		"INSERT INTO events(title, counter_id) VALUES($1, $2) RETURNING id, title, counter_id, created_at",
		req.GetEventTitle(), c.Id,
	).Scan(&e.Id, &e.Title, &e.CounterId, &et)
	if err != nil {
		log.Printf("Failed to insert event into database: %v", err)
		return nil, err
	}

	e.CreatedAt = timestamppb.New(et)
	err = s.redis.Set(ctx, "event", e.Id, &e, 0)
	if err != nil {
		log.Printf("Failed to cache event in Redis: %v", err)
	}

	return &pbcounter.CounterServiceCreateResponse{Counter: &c}, nil
}

func (s *counterServer) Get(ctx context.Context, req *pbcounter.CounterServiceGetRequest) (*pbcounter.CounterServiceGetResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("must provide id of counter to get")
	}

	var c pbcounter.Counter

	// first, check Redis
	err := s.redis.Get(ctx, "counter", req.Id, &c)
	if err != nil {
		log.Printf("Failed to get counter from Redis: %v", err)
	} else {
		return &pbcounter.CounterServiceGetResponse{Counter: &c}, nil
	}

	var t time.Time
	err = s.db.QueryRow("SELECT id, title, count, timestamp FROM counters WHERE id = $1", req.Id).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		log.Printf("Failed to get counter from database: %v", err)
		return nil, err
	}

	c.Timestamp = timestamppb.New(t)

	// after we failed to find the counter in redis, but found it in postgres,
	// update the redis cache so it's there for next time.
	err = s.redis.Set(ctx, "counter", c.Id, &c, 0)
	if err != nil {
		log.Printf("Failed to cache counter in Redis: %v", err)
	}

	return &pbcounter.CounterServiceGetResponse{Counter: &c}, nil
}

func (s *counterServer) List(ctx context.Context, req *pbcounter.CounterServiceListRequest) (*pbcounter.CounterServiceListResponse, error) {
	var err error

	// First, get all the counter IDs from Postgres
	rows, err := s.db.Query("SELECT id FROM counters")
	if err != nil {
		log.Printf("Failed to query database for counter IDs: %v", err)
		return nil, err
	}
	defer rows.Close()

	var counters []*pbcounter.Counter

	// start iterating over the rows
	for rows.Next() {
		var id string
		var c pbcounter.Counter

		// Get each ID from initial postgres query
		err := rows.Scan(&id)
		if err != nil {
			log.Printf("Failed to read row: %v", err)
			return nil, err
		}

		err = s.redis.Get(ctx, "counter", id, &c)
		if err != nil {
			log.Printf("Failed to get counter from Redis: %v", err)
		} else {
			counters = append(counters, &c)
			continue
		}

		// if not - fetch from Postgres
		var t time.Time
		err = s.db.QueryRow("SELECT id, title, count, timestamp FROM counters WHERE id = $1", id).Scan(&c.Id, &c.Title, &c.Count, &t)
		if err != nil {
			log.Printf("Failed to fetch counter from postgres during list iteration: %v", err)
			continue
		}

		c.Timestamp = timestamppb.New(t)
		counters = append(counters, &c)

		// after we failed to find the counter in redis, but found it in postgres,
		// update the redis cache so it's there for next time.
		err = s.redis.Set(ctx, "counter", c.Id, &c, 0)
		if err != nil {
			log.Printf("Failed to cache counter in Redis: %v", err)
		}
	}

	// if something goes wrong during rows.Next(), this will fire
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

	// 4. Now update redis accordingly
	err = s.redis.Set(ctx, "counter", c.Id, &c, 0)
	if err != nil {
		log.Printf("Failed to update cache in Redis for counter: %v", err)
	}

	err = s.redis.Set(ctx, "event", e.Id, &e, 0)
	if err != nil {
		log.Printf("Failed to update cache in Redis for event: %v", err)
	}

	return &pbcounter.CounterServiceIncrementResponse{
		Counter: &c,
		Event:   &e,
	}, nil
}

func (s *counterServer) Delete(ctx context.Context, req *pbcounter.CounterServiceDeleteRequest) (*pbcounter.CounterServiceDeleteResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("id must be provided to delete")
	}

	// Start a database transaction
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		log.Printf("Failed to start transaction: %v", err)
		return nil, err
	}

	// Get associated event IDs which we are going to use to invalidate the Redis cache
	eventIDs := []string{}
	eventRows, err := tx.Query("SELECT id FROM events WHERE counter_id = $1", req.Id)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to retrieve event IDs: %v", err)
		return nil, err
	}
	for eventRows.Next() {
		var eventID string
		if err := eventRows.Scan(&eventID); err != nil {
			tx.Rollback()
			log.Printf("Failed to scan event ID: %v", err)
			return nil, err
		}
		eventIDs = append(eventIDs, eventID)
	}
	eventRows.Close()

	// Delete associated events from the database
	_, err = tx.Exec("DELETE FROM events WHERE counter_id = $1", req.Id)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to delete associated events from database: %v", err)
		return nil, err
	}

	// Delete the counter itself
	var c pbcounter.Counter
	err = tx.QueryRow("DELETE FROM counters WHERE id = $1 RETURNING id", req.Id).Scan(&c.Id)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to delete counter from database: %v", err)
		return nil, err
	}

	// Commit the transaction
	if err = tx.Commit(); err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		return nil, err
	}

	// Invalidate the Redis cache for the counter
	err = s.redis.Del(ctx, "counter", req.Id)
	if err != nil {
		log.Printf("Failed to delete counter from Redis: %v", err)
	}

	// Invalidate Redis cache for associated events
	for _, eventID := range eventIDs {
		err = s.redis.Del(ctx, "event", eventID)
		if err != nil {
			log.Printf("Failed to delete event %s from Redis: %v", eventID, err)
		}
	}

	return &pbcounter.CounterServiceDeleteResponse{}, nil
}
