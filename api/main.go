package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"
	"time"

	pb "github.com/alextebbs/counters/api/pb/counter/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/timestamppb"

	_ "github.com/lib/pq"
)

type counterServer struct {
	pb.UnimplementedCounterServiceServer
	db *sql.DB
}

func (s *counterServer) CreateCounter(ctx context.Context, req *pb.CreateCounterRequest) (*pb.CreateCounterResponse, error) {
	// QUESTION: is this right? these things are just "" when not provided? I feel like
	// i'm used to seeing this as if req.Title == nil || req.EventTitle == nil
	if req.Title == "" || req.EventTitle == "" {
		return nil, fmt.Errorf("must provide title and event_title to create a counter")
	}

	var c pb.Counter
	var t time.Time
	err := s.db.QueryRow(
		"INSERT INTO counters(title) VALUES($1) RETURNING id, title, count, timestamp",
		req.GetTitle()).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		log.Printf("Failed to insert counter into database: %v", err)
		return nil, err
	}

	_, err = s.db.Exec(
		"INSERT INTO events(title, duration, counter_id) VALUES($1)",
		req.GetEventTitle(), time.Duration(0), c.Id,
	)
	if err != nil {
		log.Printf("Failed to insert event into database: %v", err)
		return nil, err
	}

	c.Timestamp = timestamppb.New(t)
	return &pb.CreateCounterResponse{Counter: &c}, nil
}

func (s *counterServer) GetCounters(ctx context.Context, req *pb.GetCountersRequest) (*pb.GetCountersResponse, error) {
	var rows *sql.Rows
	var err error

	if req.Id == "" {
		rows, err = s.db.Query("SELECT id, title, count, timestamp FROM counters")
	} else {
		rows, err = s.db.Query("SELECT id, title, count, timestamp FROM counters WHERE id = $1", req.Id)
	}

	if err != nil {
		log.Printf("Failed to query database for counters: %v", err)
		return nil, err
	}
	defer rows.Close()

	var counters []*pb.Counter
	for rows.Next() {
		var c pb.Counter
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

	return &pb.GetCountersResponse{
		Counters: counters,
	}, nil
}

func (s *counterServer) GetEvents(ctx context.Context, req *pb.GetEventsRequest) (*pb.GetEventsResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("must provide counter_id to get events")
	}

	rows, err := s.db.Query("SELECT event_id, title, duration, created_at FROM events WHERE counter_id = $1", req.Id)
	if err != nil {
		log.Printf("Failed to query database for events: %v", err)
		return nil, err
	}
	defer rows.Close()

	var events []*pb.Event
	for rows.Next() {
		var e pb.Event
		err := rows.Scan(&e.Id, &e.Title, &e.Duration, &e.CreatedAt)
		if err != nil {
			log.Printf("Failed to read row: %v", err)
			return nil, err
		}
		events = append(events, &e)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Failed during rows iteration: %v", err)
		return nil, err
	}

	return &pb.GetEventsResponse{
		Events: events,
	}, nil
}

func (s *counterServer) IncrementCounter(ctx context.Context, req *pb.IncrementCounterRequest) (*pb.IncrementCounterResponse, error) {
	if req.Id == "" || req.Title == "" {
		return nil, fmt.Errorf("id and title must be provided")
	}

	tx, err := s.db.Begin()
	if err != nil {
		log.Printf("Failed to begin transaction: %v", err)
		return nil, err
	}

	// 1. Find the last event's timestamp, the time between that and now will become
	// the duration of the new event
	var prevEventTimeStamp time.Time
	err = tx.QueryRow(`SELECT MAX(created_at) FROM events WHERE counter_id = $1`, req.Id).Scan(&prevEventTimeStamp)
	if err != nil && err != sql.ErrNoRows {
		tx.Rollback()
		log.Printf("Failed to retrieve last timestamp: %v", err)
		return nil, err
	}

	// 2. Increment the counter and get the new count and timestamp
	var c pb.Counter
	var t time.Time
	err = tx.QueryRow(
		"UPDATE counters SET count = count + 1, timestamp = NOW() WHERE id = $1 RETURNING id, title, count, timestamp",
		req.Id).Scan(&c.Id, &c.Title, &c.Count, &t)
	if err != nil {
		tx.Rollback()
		log.Printf("Failed to update counter in database: %v", err)
		return nil, err
	}

	// 3. Add the new event with the calculated duration
	var e pb.Event
	var duration time.Duration = time.Since(prevEventTimeStamp)
	err = tx.QueryRow(
		"INSERT INTO events(title, duration, counter_id) VALUES($1, $2, $3) RETURNING id, title, duration, counter_id, created_at",
		req.Title, duration, c.Id,
	).Scan(&e.Id, &e.Title, &e.Duration, &e.CounterId, &e.CreatedAt)
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

	e.Duration = durationpb.New(duration)
	c.Timestamp = timestamppb.New(t)
	return &pb.IncrementCounterResponse{
		Counter: &c,
		Event:   &e,
	}, nil
}

func (s *counterServer) DeleteCounter(ctx context.Context, req *pb.DeleteCounterRequest) (*pb.DeleteCounterResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("id must be provided to delete")
	}

	var c pb.Counter
	err := s.db.QueryRow("DELETE FROM counters WHERE id = $1 RETURNING id", req.Id).Scan(&c.Id)
	if err != nil {
		log.Printf("Failed to delete counter from database: %v", err)
		return nil, err
	}

	return &pb.DeleteCounterResponse{Message: fmt.Sprintf("Deleted counter with id: %s", c.Id)}, nil
}

func main() {
	host := "postgres"
	port := 5432
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")

	psqlInfo := fmt.Sprintf("sslmode=disable host=%s port=%d user=%s password=%s dbname=%s",
		host, port, user, password, dbname)

	db, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	defer db.Close()

	// Verify connection
	err = db.Ping()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()

	pb.RegisterCounterServiceServer(s, &counterServer{db: db})

	reflection.Register(s)

	log.Printf("server listening at %v", lis.Addr())

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
