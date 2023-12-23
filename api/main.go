package main

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/redis/go-redis/v9"
)

var ctx = context.Background()
var rdb *redis.Client

func main() {

	err := godotenv.Load(".env")
	redisHost := os.Getenv("REDIS_HOST")
	fmt.Println(redisHost)
	if err != nil {
		fmt.Println("No env file, will use system variable")
	}

	corsConfig := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}

	rdb = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:6379", redisHost),
		Password: "", // no password set
		DB:       0,  // use default DB
		Protocol: 3,  // specify 2 for RESP 2 or 3 for RESP 3
	})

	router := gin.Default()
	router.Use(cors.New(corsConfig))
	router.GET("/round/:address", getStats)

	router.Run("0.0.0.0:8080")

}

func getStats(c *gin.Context) {
	userRound := getRoundParticipation(rdb, c.Param("address"))
	if len(userRound) > 0 {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, fmt.Sprintf("address %s not found", c.Param("address")))
	}
}
