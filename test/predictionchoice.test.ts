import {
  web3,
  Project,
  addressFromContractId,
  groupOfAddress,
  Address,
  ONE_ALPH,
  sleep,
  subContractId,
  fetchContractState,
  DUST_AMOUNT,
} from "@alephium/web3";
import {
  expectAssertionError,
  randomContractId,
  testAddress,
} from "@alephium/web3-test";
import {
  PredictPrice,
  RoundChoice,
  Punter,
  PredictPriceInstance,
  RoundInstance,
  PunterInstance,
  BidPrice,
  PredictChoiceInstance,
  RoundChoiceInstance,
} from "../artifacts/ts";
import {
  deployPrediction,
  startRound,
  endRound,
  transferAlphTo,
  bid,
  contractExists,
  withdraw,
  destroyRound,
  arrayEpochToBytes,
  boostRound,
  deployPredictionChoice,
} from "./utils";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import * as base58 from "bs58";

describe("unit tests", () => {
  // Use the correct host and port
  web3.setCurrentNodeProvider("http://127.0.0.1:22973");

  const groupIndex = groupOfAddress(testAddress);
  const bidDurationSecond = 5;
  jest.setTimeout(3 * 1000 * 60);
  let predictionGame: PredictChoiceInstance;
  let round: RoundChoiceInstance;
  let punter: PunterInstance;
  let bidders: PrivateKeyWallet[];
  let operator: PrivateKeyWallet;

  function getSubContractId(path: string) {
    return subContractId(predictionGame.contractId, path, groupIndex);
  }

  function getEpochPath(epoch: bigint) {
    return "00" + epoch.toString(16).padStart(8, "0");
  }

  async function checkRoundState(epoch: bigint, amount: bigint) {
    const roundContractId = getSubContractId(
      "00" + epoch.toString(16).padStart(8, "0")
    );
    const roundContract = RoundChoice.at(addressFromContractId(roundContractId));
    const state = await roundContract.fetchState();

    expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH);
    expect(state.fields.epoch).toEqual(epoch);
  }

  async function getRoundState(epoch: bigint) {
    const roundContractId = getSubContractId(
      "00" + epoch.toString(16).padStart(8, "0")
    );
    const roundContract = RoundChoice.at(addressFromContractId(roundContractId));
    const state = await roundContract.fetchState();
    return state;
  }

  async function getRoundBidder(address: Address, epoch: bigint) {
    const bidderContractId = getSubContractId(
      "01" + base58.decode(address) + epoch.toString(16).padStart(8, "0")
    );
    const bidderContract = RoundChoice.at(addressFromContractId(bidderContractId));
    const state = await bidderContract.fetchState();
    return state;
  }

  beforeEach(async () => {
    operator = PrivateKeyWallet.Random(groupIndex);
    predictionGame = (
      await deployPredictionChoice(operator.address, bidDurationSecond, 0n, "Default title")
    ).contractInstance;
    bidders = Array.from(Array(5).keys()).map((_) =>
      PrivateKeyWallet.Random(groupIndex)
    );

    for (const bidder of bidders) {
      await transferAlphTo(bidder.address, 100n * ONE_ALPH);
    }

    await transferAlphTo(operator.address, 100n * ONE_ALPH);
  });


  test("create round, boost it", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame);
    await bid(bidder1, predictionGame, 9n * ONE_ALPH + ONE_ALPH, true);
    await bid(bidder2, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);
    await boostRound(operator, predictionGame, 0n, 10n*ONE_ALPH, true)

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, true);

    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);

    const amountFalse = roundState.fields.amountFalse;
    const amountTrue = roundState.fields.amountTrue;
    const totalAmount = roundState.fields.totalAmount;
    const treasuryAmount = roundState.fields.treasuryAmount;
    const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
    const rewardAmount = roundState.fields.rewardAmount;
    const sideWon = roundState.fields.sideWon;

    //const bidder1State = getRoundBidder(bidder1.address, 0n);
    //console.log(bidder1State);
    expect(roundState.fields.feesBasisPts).toEqual(100n)
    expect(amountTrue).toEqual(9n * ONE_ALPH);
    expect(amountFalse).toEqual(11n * ONE_ALPH);
    expect(totalAmount).toEqual(30n * ONE_ALPH);
    expect(treasuryAmount).toEqual(3n * 10n**17n);
    expect(roundState.asset.alphAmount).toEqual(10n*ONE_ALPH + 21n * ONE_ALPH);
    expect(predictionState.fields.epoch).toEqual(1n);
    expect(roundState.fields.totalAmountBoost).toEqual(10n * ONE_ALPH)
    expect(rewardBaseCalAmount).toEqual(amountFalse);
    expect(rewardAmount).toEqual(297n*10n**17n);
    expect(sideWon).toEqual(true);

    const arrayEpochBytes = arrayEpochToBytes([0])


    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);

    const bidder2Balance = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(bidder2.address)

    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);
    const bidder2BalanceAfterWithdraw = await web3.getCurrentNodeProvider().addresses.getAddressesAddressBalance(bidder2.address)

    // round amount to get right amount
    expect((BigInt(bidder2Balance.balance)+ONE_ALPH)/10n**17n).toEqual(BigInt(bidder2BalanceAfterWithdraw.balance)/10n**17n)

    const roundStateWithdraw = await getRoundState(0n);
    //console.log(roundStateWithdraw.fields)

    const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;
    const rewardBaseCalAmountWithdraw = roundStateWithdraw.fields.rewardBaseCalAmount
    expect(treasuryAmount).toEqual(totalAmountWithdraw);

    //console.log(roundStateWithdraw.asset.alphAmount)
    expect(roundStateWithdraw.asset.alphAmount).toEqual(
      ONE_ALPH + totalAmountWithdraw
    );

    await destroyRound(operator, predictionGame, arrayEpochToBytes([0]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);
  });


  test("2 rounds, 3 players, player 1 claim other rewards", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];
    const bidder3 = bidders[2];

    await startRound(operator, predictionGame, 10n);


    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);
    await bid(bidder2, predictionGame, 2n * ONE_ALPH, false);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, true)

    //ROUND TWO
    await startRound(operator, predictionGame, 10n);

    const predictionState = await predictionGame.fetchState();
    expect(predictionState.fields.epoch).toEqual(1n)

    
    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, false);

    await bid(bidder2, predictionGame, 2n * ONE_ALPH, true);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, true);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, false)


    const arrayEpochBytes = arrayEpochToBytes([0,1])
    

    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address)
    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder2.address);
    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder3.address);

    await destroyRound(operator, predictionGame,  arrayEpochToBytes([0,1]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);

  });

  test("create round, 5 bidders, none won, withdraw", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];
    const bidder3 = bidders[2];
    const bidder4 = bidders[3];
    const bidder5 = bidders[4];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    await bid(bidder1, predictionGame, 9n * ONE_ALPH + ONE_ALPH, false);
    await bid(bidder2, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);
    await bid(bidder3, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);

    await bid(bidder4, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);
    await bid(bidder5, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);


    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 9n, false, true);

    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);
    const amountDown = roundState.fields.amountFalse;
    const amountUp = roundState.fields.amountTrue;
    const totalAmount = roundState.fields.totalAmount;
    const treasuryAmount = roundState.fields.treasuryAmount;
    const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
    const rewardAmount = roundState.fields.rewardAmount;
    const sideWon = roundState.fields.sideWon;
    const numAttendees = roundState.fields.counterAttendees;

    //const bidder1State = getRoundBidder(bidder1.address, 0n);
    //console.log(bidder1State);

    expect(amountDown).toEqual(53n * ONE_ALPH);
    expect(amountUp).toEqual(0n);
    expect(totalAmount).toEqual(53n * ONE_ALPH);
    expect(treasuryAmount).toEqual(53n * 10n ** 16n);
    expect(roundState.asset.alphAmount).toEqual(53n * ONE_ALPH+ONE_ALPH);
    expect(predictionState.fields.epoch).toEqual(1n);
    expect(rewardBaseCalAmount).toEqual(amountDown);
    expect(rewardAmount).toEqual(53n * ONE_ALPH - 53n * 10n ** 16n);
    expect(sideWon).toEqual(true);
    expect(numAttendees).toEqual;


    const arrayEpochBytes = arrayEpochToBytes([0])

    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);
    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);
    await withdraw(bidder3, predictionGame, arrayEpochBytes, bidder3.address);
    await withdraw(bidder4, predictionGame, arrayEpochBytes, bidder4.address);
    await withdraw(bidder5, predictionGame, arrayEpochBytes, bidder5.address);

    const roundStateWithdraw = await getRoundState(0n);

    const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;
    const counterAttendeesWithdraw = roundStateWithdraw.fields.counterAttendees
    expect(totalAmountWithdraw).toEqual(totalAmount);
    expect(counterAttendeesWithdraw).toEqual(0n)

    expect(roundStateWithdraw.asset.alphAmount).toEqual(
      ONE_ALPH + totalAmount
    );

    await destroyRound(operator, predictionGame,  arrayEpochToBytes([0]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);
  });


  test("create round, bid, withdraw", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    await bid(bidder1, predictionGame, 9n * ONE_ALPH + ONE_ALPH, true);
    await bid(bidder2, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, false);

    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);

    const amountDown = roundState.fields.amountFalse;
    const amountUp = roundState.fields.amountTrue;
    const totalAmount = roundState.fields.totalAmount;
    const treasuryAmount = roundState.fields.treasuryAmount;
    const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
    const rewardAmount = roundState.fields.rewardAmount;
    const sideWon = roundState.fields.sideWon;

    //const bidder1State = getRoundBidder(bidder1.address, 0n);
    //console.log(bidder1State);
    //console.log(roundState.fields)
    expect(roundState.fields.feesBasisPts).toEqual(100n)
    expect(amountUp).toEqual(9n * ONE_ALPH);
    expect(amountDown).toEqual(11n * ONE_ALPH);
    expect(totalAmount).toEqual(20n * ONE_ALPH);
    expect(treasuryAmount).toEqual(20n * 10n ** 16n);
    expect(roundState.asset.alphAmount).toEqual(21n * ONE_ALPH);
    expect(predictionState.fields.epoch).toEqual(1n);
    expect(rewardBaseCalAmount).toEqual(amountDown);
    expect(rewardAmount).toEqual(20n * ONE_ALPH - 20n * 10n ** 16n);
    expect(sideWon).toEqual(false);

    const arrayEpochBytes = arrayEpochToBytes([0])
    
    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);
    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);

    const roundStateWithdraw = await getRoundState(0n);

    const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;

    expect(totalAmountWithdraw).toEqual(treasuryAmount);
    expect(roundStateWithdraw.asset.alphAmount).toEqual(
      ONE_ALPH + treasuryAmount
    );

    await destroyRound(operator, predictionGame, arrayEpochToBytes([0]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);
  });






  

  test("create round, end it, cannot destroy", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    //create contract
    await bid(bidder2, predictionGame, 3n * ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);

    await endRound(operator, predictionGame, 11n, false, true);

    const predictionState = await predictionGame.fetchState();

    expect(predictionState.fields.epoch).toEqual(1n);

    await expectAssertionError(
      destroyRound(operator, predictionGame,  arrayEpochToBytes([0])),
      addressFromContractId(
        getSubContractId(getEpochPath(predictionState.fields.epoch - 1n))
      ),
      101
    );
  });



  test("create round, end it, cannot destroy still people to withdraw", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    //create contract
    await bid(bidder2, predictionGame, 3n * ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);

    await endRound(operator, predictionGame, 11n, false, true);
   
    await withdraw(bidder2, predictionGame, "00", bidder2.address);

    const predictionState = await predictionGame.fetchState();

    expect(predictionState.fields.epoch).toEqual(1n);

    await expectAssertionError(
      destroyRound(operator, predictionGame,arrayEpochToBytes([0])),
      addressFromContractId(
        getSubContractId(getEpochPath(predictionState.fields.epoch - 1n))
      ),
      101
    );
  });

  test("create round, end it too early", async () => {
    const bidder1 = bidders[0];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);
    await expectAssertionError(
      endRound(operator, predictionGame, 11n, false, false),
      predictionGame.address,
      6
    );
  });


  test("2 rounds, 3 players", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];
    const bidder3 = bidders[2];

    await startRound(operator, predictionGame, 10n);


    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    await bid(bidder2, predictionGame, 2n * ONE_ALPH, false);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, false)

    //ROUND TWO
    await startRound(operator, predictionGame, 10n);

    const predictionState = await predictionGame.fetchState();
    expect(predictionState.fields.epoch).toEqual(1n)

    
    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, false);

    await bid(bidder2, predictionGame, 2n * ONE_ALPH, true);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, true);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, true)


    const arrayEpochBytes = arrayEpochToBytes([0,1])
    
    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);
    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);

  });


  test("2 rounds, 3 players, destroy all contracts", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];
    const bidder3 = bidders[2];

    await startRound(operator, predictionGame, 10n);


    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    await bid(bidder2, predictionGame, 2n * ONE_ALPH, false);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, false);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, false)

    //ROUND TWO
    await startRound(operator, predictionGame, 10n);

    const predictionState = await predictionGame.fetchState();
    expect(predictionState.fields.epoch).toEqual(1n)

    
    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, false);

    await bid(bidder2, predictionGame, 2n * ONE_ALPH, true);
    await bid(bidder3, predictionGame, 2n * ONE_ALPH, true);

    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 11n, false, false)


    const arrayEpochBytes = arrayEpochToBytes([0,1])
    
    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);
    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);
    await withdraw(bidder3, predictionGame, arrayEpochBytes, bidder3.address);

    await destroyRound(operator, predictionGame,  arrayEpochToBytes([0,1]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);

  });


  test("bid 2 times", async () => {
    const bidder1 = bidders[0];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    await expectAssertionError(
      bid(bidder1, predictionGame, 2n * ONE_ALPH, true),
      predictionGame.address,
      8
    );
  });

  test("Start 2 rounds", async () => {

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    await expectAssertionError(
      startRound(operator, predictionGame, 10n),
      predictionGame.address,
      5
    );


    
  });


  test("Start round and directly start new one",async () => {
    
    await startRound(operator, predictionGame, 10n);
    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);


    await sleep((bidDurationSecond+1) * 1000);

    await endRound(operator, predictionGame, 11n, true, false)
    const predictionStateRound1 = await predictionGame.fetchState();
    const roundStateRound1 = await getRoundState(1n);

    expect(predictionStateRound1.fields.epoch).toEqual(1n)
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(true);

  })

  test("End before start", async () => {

    //console.log("Game contract id", predictionGame.contractId);
    await expectAssertionError(
      endRound(operator, predictionGame, 10n, false, false),
      predictionGame.address,
      7
    );


    
  });


  test("bid after timestamp over", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);

    //console.log(roundState.fields);
    //create contract
    await bid(bidder1, predictionGame, 2n * ONE_ALPH, true);

    await sleep((bidDurationSecond+1) * 1000);
    await expectAssertionError(
      bid(bidder2, predictionGame, 2n * ONE_ALPH, true),
      predictionGame.address,
      4
    );

    await endRound(operator, predictionGame, 0n, false, false);

    //const predictionState = await predictionGame.fetchState();

    //expect(predictionState.fields.epoch).toEqual(1n);
  });

  



  test("create round, 5 bidders, withdraw", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];
    const bidder3 = bidders[2];
    const bidder4 = bidders[3];
    const bidder5 = bidders[4];

    //console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    await bid(bidder1, predictionGame, 9n * ONE_ALPH + ONE_ALPH, true);
    await bid(bidder2, predictionGame, 11n * ONE_ALPH + ONE_ALPH, true);
    await bid(bidder3, predictionGame, 11n * ONE_ALPH + ONE_ALPH, true);

    await bid(bidder4, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);
    await bid(bidder5, predictionGame, 11n * ONE_ALPH + ONE_ALPH, false);


    await sleep((bidDurationSecond+1) * 1000);
    await endRound(operator, predictionGame, 0n, false, false);

    const predictionState = await predictionGame.fetchState();
    const roundState = await getRoundState(0n);
    const amountDown = roundState.fields.amountFalse;
    const amountUp = roundState.fields.amountTrue;
    const totalAmount = roundState.fields.totalAmount;
    const treasuryAmount = roundState.fields.treasuryAmount;
    const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
    const rewardAmount = roundState.fields.rewardAmount;
    const sideWon = roundState.fields.sideWon;

    //const bidder1State = getRoundBidder(bidder1.address, 0n);
    //console.log(bidder1State);

    expect(amountUp).toEqual(31n * ONE_ALPH);
    expect(amountDown).toEqual(22n * ONE_ALPH);
    expect(totalAmount).toEqual(53n * ONE_ALPH);
    expect(treasuryAmount).toEqual(53n * 10n ** 16n);
    expect(roundState.asset.alphAmount).toEqual(53n * ONE_ALPH+ONE_ALPH);
    expect(predictionState.fields.epoch).toEqual(1n);
    expect(rewardBaseCalAmount).toEqual(amountDown);
    expect(rewardAmount).toEqual(53n * ONE_ALPH - 53n * 10n ** 16n);
    expect(sideWon).toEqual(false);


    const arrayEpochBytes = arrayEpochToBytes([0])

    await withdraw(bidder1, predictionGame, arrayEpochBytes, bidder1.address);
    await withdraw(bidder2, predictionGame, arrayEpochBytes, bidder2.address);
    await withdraw(bidder3, predictionGame, arrayEpochBytes,bidder3.address );
    await withdraw(bidder4, predictionGame, arrayEpochBytes, bidder4.address);
    await withdraw(bidder5, predictionGame, arrayEpochBytes, bidder5.address);

    const roundStateWithdraw = await getRoundState(0n);

    const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;

    expect(totalAmountWithdraw).toEqual(treasuryAmount);
    expect(roundStateWithdraw.asset.alphAmount).toEqual(
      ONE_ALPH + treasuryAmount
    );

    await destroyRound(operator, predictionGame,  arrayEpochToBytes([0]));
    const exists = await contractExists(
      addressFromContractId(
        getSubContractId(
          "00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0")
        )
      )
    );
    expect(exists).toEqual(false);
  });

  
});
