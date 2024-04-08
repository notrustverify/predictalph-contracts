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

	db = connect(os.Getenv("DB_PATH"))

	router := gin.Default()
	router.Use(cors.New(corsConfig))
	router.GET("/round/:contractid/:address", getUserRoundsPlayed)
	router.GET("/allround/:contractid/:address", getAllUserRounds)
	router.GET("/topplayer/:contractid", getTopPlayers)
	router.GET("/round/:contractid/notclaimed", getAllRoundNotClaimed)
	router.GET("/round/:contractid/claimed", getAllRoundClaimed)
	router.GET("/address/:contractid/expiredclaim", getExpiredClaimed)

	router.Run("0.0.0.0:8080")

}

func getUserRoundsPlayed(c *gin.Context) {
	userRound, err := getRoundParticipation(db, c.Param("contractid"), c.Param("address"), false)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}

func getAllUserRounds(c *gin.Context) {
	userRoundClaimed, err := getRoundParticipation(db, c.Param("contractid"), c.Param("address"), true)
	if err != nil {
		fmt.Println("Error on getAllUser ", err)
	}
	userRoundNotClaimed, err := getRoundParticipation(db, c.Param("contractid"), c.Param("address"), false)
	if err != nil {
		fmt.Println("Error on getAllUser ", err)
	}

	userRound := append(userRoundClaimed, userRoundNotClaimed...)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}

func getTopPlayers(c *gin.Context) {
	userRound, err := getAllPlayer(db, c.Param("contractid"), 10)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}

func getAllRoundNotClaimed(c *gin.Context) {
	userRound, err := getRoundClaimedOrNot(db, c.Param("contractid"), false)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}

func getAllRoundClaimed(c *gin.Context) {
	userRound, err := getRoundClaimedOrNot(db, c.Param("contractid"), false)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}

func getExpiredClaimed(c *gin.Context) {
	now := int(time.Now().UTC().Unix())
	userRound, err := getExpiredClaimedOrNot(db, c.Param("contractid"), now, false)
	if len(userRound) > 0 && err == nil {
		c.JSON(http.StatusOK, userRound)
	} else {
		c.JSON(http.StatusOK, make([]string, 0))
	}
}
