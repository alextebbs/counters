package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"os"

	pbcounter "github.com/alextebbs/counters/pb/counter/v1"
	pbevent "github.com/alextebbs/counters/pb/event/v1"
	"github.com/go-redis/redis/v8"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	_ "github.com/lib/pq"
)

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

	err = db.Ping()
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	redisClient := redis.NewClient(&redis.Options{
		Addr: "redis:6379",
	})

	_, err = redisClient.Ping(context.Background()).Result()
	if err != nil {
		log.Fatalf("failed to connect to Redis: %v", err)
	}

	redisService := NewRedisService(redisClient)

	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	s := grpc.NewServer()

	pbcounter.RegisterCounterServiceServer(s, &counterServer{db: db, redis: redisService})
	pbevent.RegisterEventServiceServer(s, &eventServer{db: db, redis: redisService})

	reflection.Register(s)

	log.Printf("server listening at %v", lis.Addr())

	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
