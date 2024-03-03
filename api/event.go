package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	pbevent "github.com/alextebbs/counters/pb/event/v1"
	"google.golang.org/protobuf/types/known/durationpb"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type eventServer struct {
	pbevent.UnimplementedEventServiceServer
	db    *sql.DB
	redis *RedisService
}

func (s *eventServer) List(ctx context.Context, req *pbevent.EventServiceListRequest) (*pbevent.EventServiceListResponse, error) {
	if req.Id == "" {
		return nil, fmt.Errorf("must provide counter_id to get events")
	}

	rows, err := s.db.Query("SELECT id FROM events WHERE counter_id = $1", req.Id)
	if err != nil {
		log.Printf("Failed to query database for events: %v", err)
		return nil, err
	}
	defer rows.Close()

	var events []*pbevent.Event

	for rows.Next() {
		var id string
		var e pbevent.Event
		err := rows.Scan(&id)
		if err != nil {
			log.Printf("Failed to read row: %v", err)
			return nil, err
		}

		err = s.redis.Get(ctx, "event", id, &e)
		if err == nil {
			events = append(events, &e)
			continue
		}

		// this is annoying, we need to scan these in as standard lib Go "Duration"
		// and "Time" and then convert them to protobuf durationpb and timestamppb.
		var d time.Duration
		var t time.Time
		err = s.db.QueryRow("SELECT id, title, duration, created_at FROM events WHERE id = $1", id).Scan(&e.Id, &e.Title, &d, &t)
		if err != nil {
			log.Printf("Failed to fetch event from postgres during list iteration: %v", err)
			return nil, err
		}
		e.Duration = durationpb.New(d)
		e.CreatedAt = timestamppb.New(t)
		events = append(events, &e)

		err = s.redis.Set(ctx, "event", e.Id, &e, 0)
		if err != nil {
			log.Printf("Failed to cache event in Redis: %v", err)
		}
	}

	if err = rows.Err(); err != nil {
		log.Printf("Failed during rows iteration: %v", err)
		return nil, err
	}

	return &pbevent.EventServiceListResponse{
		Events: events,
	}, nil
}
