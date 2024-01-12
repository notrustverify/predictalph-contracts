package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

const ONE_ALPH = 10e18

func main() {

	err := godotenv.Load(".env")
	redisHost := os.Getenv("REDIS_HOST")

	if redisHost == "" {
		redisHost = "127.0.0.1"
	}

	if err != nil {
		fmt.Println("No env file, will use system variable")
	}

	corsConfig := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}

	db = connect("../data/roundsData.sqlite")

	router := gin.Default()
	router.Use(cors.New(corsConfig))
	router.GET("/round/:address", getUserRoundsPlayed)
	router.GET("/allround/:address", getAllUserRounds)
	router.GET("/topplayer", getTopPlayers)
	router.GET("/round/notclaimed", getAllRoundNotClaimed)
	router.GET("/round/claimed", getAllRoundClaimed)
	router.GET("/address/expiredclaim", getExpiredClaimed)

	router.Run("0.0.0.0:8080")

}

func getUserRoundsPlayed(c *gin.Context) {
	userRound, err := getRoundParticipation(db, c.Param("address"), 0)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, fmt.Sprintf("address %s not found", c.Param("address")))
	}
}

func getAllUserRounds(c *gin.Context) {
	userRound, err := getRoundParticipation(db, c.Param("address"), 1)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, fmt.Sprintf("address %s not found", c.Param("address")))
	}
}

func getTopPlayers(c *gin.Context) {
	userRound, err := getAllPlayer(db, 10)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, "nobody played yet")
	}
}

func getAllRoundNotClaimed(c *gin.Context) {
	userRound, err := getRoundClaimedOrNot(db, 0)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, "nobody played yet")
	}
}

func getAllRoundClaimed(c *gin.Context) {
	userRound, err := getRoundClaimedOrNot(db, 1)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, "nobody played yet")
	}
}

func getExpiredClaimed(c *gin.Context) {
	now := int(time.Now().UTC().Unix())
	userRound, err := getExpiredClaimedOrNot(db, now, false)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusNotFound, "nobody played yet")
	}
}
