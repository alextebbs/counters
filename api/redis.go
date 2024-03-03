package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
	"google.golang.org/protobuf/proto"
)

// Wraps a redis client with some convenience methods for marshalling and
// unmarshalling protobuf messages during cache storage and retrieval.
type RedisService struct {
	client *redis.Client
}

func NewRedisService(client *redis.Client) *RedisService {
	return &RedisService{client: client}
}

// Cache a protobuf message in Redis.
func (rs *RedisService) Set(ctx context.Context, keyPrefix, id string, message proto.Message, expiration time.Duration) error {
	data, err := proto.Marshal(message)
	if err != nil {
		log.Printf("Failed to serialize data for Redis caching: %v", err)
		return err
	}

	redisKey := fmt.Sprintf("%s:%s", keyPrefix, id)
	err = rs.client.Set(ctx, redisKey, data, expiration).Err()
	if err != nil {
		log.Printf("Failed to store data in Redis: %s, error: %v", redisKey, err)
		return err
	}

	log.Printf("Successfully cached data in Redis for key: %s", redisKey)
	return nil
}

// Get a protobuf message from Redis.
func (rs *RedisService) Get(ctx context.Context, keyPrefix, id string, message proto.Message) error {
	redisKey := fmt.Sprintf("%s:%s", keyPrefix, id)
	data, err := rs.client.Get(ctx, redisKey).Bytes()

	if err != nil {
		if err == redis.Nil {
			log.Printf("Item not found in Redis for key: %s, error: %v", redisKey, err)
			return err
		}
		log.Printf("Failed to retrieve data from Redis for key: %s, error: %v", redisKey, err)
		return err
	}

	if err := proto.Unmarshal(data, message); err != nil {
		log.Printf("Failed to unmarshal protobuf data for key: %s, error: %v", redisKey, err)
		return err
	}

	log.Printf("Successfully retrieved and unmarshaled data from Redis for key: %s", redisKey)
	return nil
}

// Delete something from redis
func (rs *RedisService) Del(ctx context.Context, keyPrefix, id string) error {
	redisKey := fmt.Sprintf("%s:%s", keyPrefix, id)

	_, err := rs.client.Del(ctx, redisKey).Result()
	if err != nil {
		log.Printf("Failed to delete key from Redis: %s, error: %v", redisKey, err)
		return err
	}

	return nil
}
