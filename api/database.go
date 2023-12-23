package main

import (
	"fmt"

	"github.com/redis/go-redis/v9"
)

func keyExists(rdb *redis.Client, key string) bool {
	_, err := rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return false
	} else if err != nil {
		panic(err)
	} else {
		return true
	}
}

func getRoundParticipation(rdb *redis.Client, key string) []string {

	userRound, err := rdb.SDiff(ctx, key, "claim"+key).Result()
	if err == redis.Nil {
		fmt.Printf("%s does not exist", key)
		return []string{}
	} else if err != nil {
		panic(err)
	} else {
		return userRound
	}
}
