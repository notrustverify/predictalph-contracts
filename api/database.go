package main

import (
	"database/sql"
	"fmt"

	_ "github.com/mattn/go-sqlite3"
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
	AddressId                int     `json:"addressId"`
	RoundId                  int     `json:"roundId"`
	UpBid                    bool    `json:"upBid"`
	AmountBid                float64 `json:"amountBid"`
	Claimed                  bool    `json:"claimed"`
	ClaimedByAnyoneTimestamp int     `json:"claimedByAnyoneTimestamp"`

	Round   Round   `json:"round"`
	Address Address `json:"address"`
}

type RoundParticipationPlayed struct {
	AddressId                int     `json:"addressId"`
	RoundId                  int     `json:"roundId"`
	UpBid                    bool    `json:"upBid"`
	AmountBid                float64 `json:"amountBid"`
	Claimed                  bool    `json:"claimed"`
	ClaimedByAnyoneTimestamp int     `json:"claimedByAnyoneTimestamp"`
	NumberOfPlays            int     `json:"numberPlayed"`

	Address Address `json:"address"`
}

func getIdFromAddress(db *sql.DB, addr string) (Address, error) {

	row := db.QueryRow("SELECT id,address from Addresses WHERE address = ?", addr)
	address := Address{}
	var err error
	if err = row.Scan(&address.Id, &address.Address); err == sql.ErrNoRows {
		fmt.Printf("address not found")
		return Address{}, err
	}

	return address, err
}

func getAddressFromId(db *sql.DB, id int) (Address, error) {

	row := db.QueryRow("SELECT id,address from Addresses WHERE id = ?", id)
	addr := Address{}
	var err error
	if err = row.Scan(&addr.Id, &addr.Address); err == sql.ErrNoRows {
		fmt.Printf("address not found")
		return Address{}, err
	}

	return addr, err
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

func getRoundParticipation(db *sql.DB, addr string, isClaimedRound int) ([]RoundParticipation, error) {

	address, err := getIdFromAddress(db, addr)
	if err != nil {
		fmt.Println(err)
		return []RoundParticipation{}, err
	}
	rows, err := db.Query("SELECT AddressId, RoundId, Claimed, UpBid, AmountBid, ClaimedByAnyoneTimestamp from RoundParticipations WHERE AddressId = ? AND CLAIMED = ?", address.Id, isClaimedRound)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipation{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipation{}

	for rows.Next() {
		i := RoundParticipation{}
		err = rows.Scan(&i.AddressId, &i.RoundId, &i.Claimed, &i.UpBid, &i.AmountBid, &i.ClaimedByAnyoneTimestamp)

		roundData, err := getRoundFromId(db, i.RoundId)
		if err != nil {
			fmt.Println(err)
		}

		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		i.Round = roundData
		i.Address = address

		roundParticipation = append(roundParticipation, i)
	}
	fmt.Printf("%+v", roundParticipation)
	return roundParticipation, err
}

func getAllPlayer(db *sql.DB, limit int) ([]RoundParticipationPlayed, error) {
	rows, err := db.Query("SELECT AddressId, RoundId, Claimed, UpBid, AmountBid, ClaimedByAnyoneTimestamp, count(addressId) as numPlay from RoundParticipations GROUP BY AddressId ORDER BY numPlay DESC LIMIT ?", limit)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipationPlayed{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipationPlayed{}

	for rows.Next() {
		i := RoundParticipationPlayed{}
		err = rows.Scan(&i.AddressId, &i.RoundId, &i.Claimed, &i.UpBid, &i.AmountBid, &i.ClaimedByAnyoneTimestamp, &i.NumberOfPlays)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		userData, err := getAddressFromId(db, i.AddressId)
		if err != nil {
			fmt.Println(err)
		}

		i.Address = userData

		roundParticipation = append(roundParticipation, i)
	}
	return roundParticipation, err
}

func getRoundClaimedOrNot(db *sql.DB, isClaimedRound int) ([]RoundParticipation, error) {
	rows, err := db.Query("SELECT AddressId, RoundId, Claimed, UpBid, AmountBid, ClaimedByAnyoneTimestamp from RoundParticipations WHERE CLAIMED = ?", isClaimedRound)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipation{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipation{}

	for rows.Next() {
		i := RoundParticipation{}
		err = rows.Scan(&i.AddressId, &i.RoundId, &i.Claimed, &i.UpBid, &i.AmountBid, &i.ClaimedByAnyoneTimestamp)

		roundData, err := getRoundFromId(db, i.RoundId)
		if err != nil {
			fmt.Println(err)
		}

		addrData, err := getAddressFromId(db, i.AddressId)
		if err != nil {
			fmt.Println(err)
		}

		i.Round = roundData
		i.Address = addrData

		roundParticipation = append(roundParticipation, i)
	}

	return roundParticipation, err

}

func getExpiredClaimedOrNot(db *sql.DB, timeNow int, isClaimed bool) ([]RoundParticipation, error) {
	rows, err := db.Query("SELECT AddressId, RoundId, Claimed, UpBid, AmountBid, ClaimedByAnyoneTimestamp from RoundParticipations WHERE ClaimedByAnyoneTimestamp < ? AND Claimed = ?", timeNow*1000, isClaimed)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipation{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipation{}

	for rows.Next() {
		i := RoundParticipation{}
		err = rows.Scan(&i.AddressId, &i.RoundId, &i.Claimed, &i.UpBid, &i.AmountBid, &i.ClaimedByAnyoneTimestamp)
		if err != nil {
			fmt.Println(err)
		}

		roundData, err := getRoundFromId(db, i.RoundId)
		if err != nil {
			fmt.Println(err)
		}

		addrData, err := getAddressFromId(db, i.AddressId)
		if err != nil {
			fmt.Println(err)
		}

		i.Round = roundData
		i.Address = addrData

		roundParticipation = append(roundParticipation, i)
	}

	return roundParticipation, err

}

func connect(file string) *sql.DB {
	db, err := sql.Open("sqlite3", file)
	if err != nil {
		panic(err)
	}

	return db
}
