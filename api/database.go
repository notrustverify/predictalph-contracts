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
	Side                     bool    `json:"side"`
	AmountBid                float64 `json:"amountBid"`
	Claimed                  bool    `json:"claimed"`
	ClaimedByAnyoneTimestamp int     `json:"claimedByAnyoneTimestamp"`

	Round   Round   `json:"round"`
	Address Address `json:"address"`
}

type RoundParticipationV2 struct {
	Address                  string  `json:"address"`
	Side                     bool    `json:"side"`
	SideWon                  bool    `json:"sideWon"`
	SideWonMultipleChoice    int     `json:"sideWonMultipleChoice"`
	SideMultipleChoice       int     `json:"sideMultipleChoice"`
	AmountBid                float64 `json:"amountBid"`
	Claimed                  bool    `json:"claimed"`
	ClaimedByAnyoneTimestamp int     `json:"claimedByAnyoneTimestamp"`
	Epoch                    int     `json:"epoch"`
	PriceStart               int     `json:"priceStart"`
	PriceEnd                 int     `json:"priceEnd"`
	TypeBet                  string  `json:"type"`
}

type RoundParticipationPlayed struct {
	Address       string `json:"address"`
	NumberOfPlays int    `json:"numberPlayed"`
}

func getRoundParticipation(db *sql.DB, contractId string, addr string, isClaimedRound bool) ([]RoundParticipationV2, error) {

	rows, err := db.Query("SELECT Address, Claimed, Side, AmountBid, ClaimedByAnyoneTimestamp, Epoch, PriceStart, PriceEnd, SideWon, sideMultipleChoice, RoundParticipations.typebet, SideWonMultipleChoice from RoundParticipations INNER JOIN Games ON games.id = RoundParticipations.gameid INNER JOIN addresses ON addresses.id = RoundParticipations.addressid INNER JOIN rounds ON rounds.id = RoundParticipations.roundId WHERE Claimed = ? AND Games.contractId = ? AND Addresses.address = ?", isClaimedRound, contractId, addr)

	if err != nil {
		fmt.Println(err)

		return []RoundParticipationV2{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipationV2{}

	for rows.Next() {
		i := RoundParticipationV2{}
		err = rows.Scan(&i.Address, &i.Claimed, &i.Side, &i.AmountBid, &i.ClaimedByAnyoneTimestamp, &i.Epoch, &i.PriceStart, &i.PriceEnd, &i.SideWon, &i.SideMultipleChoice, &i.TypeBet, &i.SideWonMultipleChoice)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		roundParticipation = append(roundParticipation, i)
	}

	return roundParticipation, err
}

func getAllPlayer(db *sql.DB, contractId string, limit int) ([]RoundParticipationPlayed, error) {
	rows, err := db.Query("SELECT Address, count(addressId) as numPlay FROM RoundParticipations INNER JOIN Games ON games.id = RoundParticipations.gameid INNER JOIN addresses ON addresses.id = RoundParticipations.addressid INNER JOIN rounds ON rounds.id = RoundParticipations.roundId WHERE Games.contractid = ? GROUP BY addressId ORDER BY numplay DESC limit ?", contractId, limit)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipationPlayed{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipationPlayed{}

	for rows.Next() {
		i := RoundParticipationPlayed{}
		err = rows.Scan(&i.Address, &i.NumberOfPlays)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		roundParticipation = append(roundParticipation, i)
	}
	return roundParticipation, err
}

func getRoundClaimedOrNot(db *sql.DB, contractId string, isClaimedRound bool) ([]RoundParticipationV2, error) {
	rows, err := db.Query("SELECT Address, Claimed, Side, AmountBid, ClaimedByAnyoneTimestamp, Epoch, PriceStart, PriceEnd, SideWon sideMultipleChoice, TypeBet RoundParticipations.typebet, SideWonMultipleChoice from RoundParticipations INNER JOIN Games ON games.id = RoundParticipations.gameid INNER JOIN addresses ON addresses.id = RoundParticipations.addressid INNER JOIN rounds ON rounds.id = RoundParticipations.roundId WHERE Claimed = ? AND Games.contractid = ?", isClaimedRound, contractId)
	if err != nil {
		fmt.Println(err)

		return []RoundParticipationV2{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipationV2{}

	for rows.Next() {
		i := RoundParticipationV2{}
		err = rows.Scan(&i.Address, &i.Claimed, &i.Side, &i.AmountBid, &i.ClaimedByAnyoneTimestamp, &i.Epoch, &i.PriceStart, &i.PriceEnd, &i.SideWon, &i.SideMultipleChoice, &i.TypeBet, &i.SideWonMultipleChoice)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

		roundParticipation = append(roundParticipation, i)
	}

	return roundParticipation, err

}

func getExpiredClaimedOrNot(db *sql.DB, contractId string, timeNow int, isClaimed bool) ([]RoundParticipationV2, error) {
	rows, err := db.Query("SELECT Address, Claimed, Side, AmountBid, ClaimedByAnyoneTimestamp, Epoch, PriceStart, PriceEnd, SideWon, sideMultipleChoice, RoundParticipations.typebet, SideWonMultipleChoice from RoundParticipations INNER JOIN Games ON games.id = RoundParticipations.gameid INNER JOIN addresses ON addresses.id = RoundParticipations.addressid INNER JOIN rounds ON rounds.id = RoundParticipations.roundId WHERE ClaimedByAnyoneTimestamp < ? AND Claimed = ? AND Games.contractid = ?", timeNow*1000, isClaimed, contractId)

	if err != nil {
		fmt.Println(err)

		return []RoundParticipationV2{}, err
	}
	defer rows.Close()

	roundParticipation := []RoundParticipationV2{}

	for rows.Next() {
		i := RoundParticipationV2{}
		err = rows.Scan(&i.Address, &i.Claimed, &i.Side, &i.AmountBid, &i.ClaimedByAnyoneTimestamp, &i.Epoch, &i.PriceStart, &i.PriceEnd, &i.SideWon, &i.SideMultipleChoice, &i.TypeBet, &i.SideWonMultipleChoice)
		if err != nil {
			fmt.Println(err)
			return nil, err
		}

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
