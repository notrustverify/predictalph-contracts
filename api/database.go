package main

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
	"github.com/redis/go-redis/v9"
)

type Address struct {
	Id      int    `json:"id"`
	Address string `json:"address"`
}

type Round struct {
	Id         int    `json:"id"`
	Epoch      string `json:"epoch"`
	PriceEnd   int    `json:"priceEnd"`
	PriceStart int    `json:"priceStart"`
}

type RoundParticipation struct {
	AddressId int   `json:"addressId"`
	RoundId   int   `json:"roundId"`
	UpBid     bool  `json:"upBid"`
	AmountBid int   `json:"amountBid"`
	Claimed   bool  `json:"claimed"`
	Round     Round `json:"Round"`
}

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

func getIdAddress(db *sql.DB, addr string) (Address, error) {

	row := db.QueryRow("SELECT id,address from Addresses WHERE address = ?", addr)
	address := Address{}
	var err error
	if err = row.Scan(&address.Id, &address.Address); err == sql.ErrNoRows {
		fmt.Printf("address not found")
		return Address{}, err
	}

	return address, err
}

func getRoundFromId(db *sql.DB, id int) (Round, error) {

	row := db.QueryRow("SELECT id,epoch, priceEnd, priceStart  from Rounds WHERE id = ?", id)
	round := Round{}
	var err error
	if err = row.Scan(&round.Id, &round.Epoch, &round.PriceEnd, &round.PriceStart); err == sql.ErrNoRows {
		fmt.Printf("address not found")
		return Round{}, err
	}

	return round, err
}

func getRoundParticipation(rdb *redis.Client, db *sql.DB, addr string, isClaimedRound int) ([]RoundParticipation, error) {

	address, err := getIdAddress(db, addr)
	if err != nil {
		fmt.Println(err)
		return []RoundParticipation{}, err
	}
	rows, err := db.Query("SELECT AddressId, RoundId, Claimed, UpBid, AmountBid from RoundParticipations WHERE AddressId = ? AND CLAIMED = ?", address.Id, isClaimedRound)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipation{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipation{}

	for rows.Next() {
		i := RoundParticipation{}
		err = rows.Scan(&i.AddressId, &i.RoundId, &i.Claimed, &i.UpBid, &i.AmountBid)

		roundData, err := getRoundFromId(db, i.RoundId)
		if err != nil {
			fmt.Println(err)
		}

		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		i.Round = roundData

		roundParticipation = append(roundParticipation, i)
	}
	fmt.Printf("%+v", roundParticipation)
	return roundParticipation, err
}

func connect(file string) *sql.DB {
	db, err := sql.Open("sqlite3", file)
	if err != nil {
		panic(err)
	}

	return db
}
