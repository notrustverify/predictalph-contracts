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
  ZERO_ADDRESS,
} from "@alephium/web3";
import {
  expectAssertionError,
  randomContractId,
  testAddress,
} from "@alephium/web3-test";
import {
  Predict,
  Round,
  Punter,
  PredictInstance,
  RoundInstance,
  PunterInstance,
  GameInstance,
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
  deployGame,
  createGame,
  gameStartRound,
  gameBid,
  gameBoostRound,
  gameEndRound,
  gameWithdraw,
  gameDestroyRound,
  changeOperator,
  changeInterval,
  gameDestroyPrediction,
} from "./utils";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import * as base58 from "bs58";
import { getRoundContractId } from "../src/utils";

describe("unit tests", () => {
  // Use the correct host and port
  web3.setCurrentNodeProvider("http://127.0.0.1:22973");

  const groupIndex = groupOfAddress(testAddress);
  const bidDurationSecond = 3;
  jest.setTimeout(3 * 1000 * 60);
  let game: GameInstance;
  let predictionGame: PredictInstance;
  let round: RoundInstance;
  let punter: PunterInstance;
  let bidders: PrivateKeyWallet[];
  let operator: PrivateKeyWallet;

  function getSubContractIdByContractId(contractId: string, path: string) {
    return subContractId(contractId, path, groupIndex);
  }

  function getSubPredictContractId(path: string) {
    return subContractId(game.contractId, path, groupIndex);
  }

  function getEpochPath(epoch: bigint) {
    return "00" + epoch.toString(16).padStart(8, "0");
  }

  function getPredictPath(gameId: bigint) {
    return "03" + gameId.toString(16).padStart(8, "0");
  }

  function getPredictObject(gameId: bigint) {
    const contractId = getSubPredictContractId(getPredictPath(gameId));

    return Predict.at(addressFromContractId(contractId));
  }

  async function checkRoundState(
    predictContractId: string,
    epoch: bigint,
    amount: bigint
  ) {
    const roundContractId = getSubContractIdByContractId(
      predictContractId,
      "00" + epoch.toString(16).padStart(8, "0")
    );
    const roundContract = Round.at(addressFromContractId(roundContractId));
    const state = await roundContract.fetchState();

    expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH);
    expect(state.fields.epoch).toEqual(epoch);
  }

  async function getPredictState(gameId: bigint) {
    const contractId = getSubPredictContractId(getPredictPath(gameId));
    const contract = Predict.at(addressFromContractId(contractId));
    const state = await contract.fetchState();
    return state;
  }

  async function getRoundState(predictContractId: string, epoch: bigint) {
    const roundContractId = getSubContractIdByContractId(
      predictContractId,
      "00" + epoch.toString(16).padStart(8, "0")
    );
    const roundContract = Round.at(addressFromContractId(roundContractId));
    const state = await roundContract.fetchState();
    return state;
  }

  async function getRoundBidder(
    predictContractId: string,
    address: Address,
    epoch: bigint
  ) {
    const bidderContractId = getSubContractIdByContractId(
      predictContractId,
      "01" + base58.decode(address) + epoch.toString(16).padStart(8, "0")
    );
    const bidderContract = Round.at(addressFromContractId(bidderContractId));
    const state = await bidderContract.fetchState();
    return state;
  }

  beforeEach(async () => {
    operator = PrivateKeyWallet.Random(groupIndex);
    game = (await deployGame(operator.address)).contractInstance;
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

    // create a new prediction
    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt(120 * 1000)
    );

    const gameState = await game.fetchState();
    const numberGame = gameState.fields.gameCounter;
    expect(numberGame).toEqual(1n);

    await gameStartRound(operator, game, 0n, 10n);
    await gameBid(bidder1, game, 0n, 9n * ONE_ALPH + ONE_ALPH, true);
    await gameBid(bidder2, game, 0n, 11n * ONE_ALPH + ONE_ALPH, false);

    const predictContractId = getSubPredictContractId(getPredictPath(0n));
    await gameBoostRound(operator, game, 0n, 0n, 10n * ONE_ALPH);

    await sleep((bidDurationSecond + 1) * 1000);
    await gameEndRound(operator, game, 0n, 11n, false);

    const predictionState = await getPredictState(0n);
    const roundState = await getRoundState(predictContractId, 0n);

    const amountDown = roundState.fields.amountDown;
    const amountUp = roundState.fields.amountUp;
    const totalAmount = roundState.fields.totalAmount;
    const treasuryAmount = roundState.fields.treasuryAmount;
    const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
    const rewardAmount = roundState.fields.rewardAmount;
    const priceEnd = roundState.fields.priceEnd;
    const playerCounter = predictionState.fields.playerCounter;

    //const bidder1State = getRoundBidder(bidder1.address, 0n);
    //console.log(bidder1State);
    expect(playerCounter).toEqual(2n);
    expect(roundState.fields.feesBasisPts).toEqual(100n);
    expect(amountUp).toEqual(9n * ONE_ALPH);
    expect(amountDown).toEqual(11n * ONE_ALPH);
    expect(totalAmount).toEqual(30n * ONE_ALPH);
    expect(treasuryAmount).toEqual(3n * 10n ** 17n);
    expect(roundState.asset.alphAmount).toEqual(
      10n * ONE_ALPH + 21n * ONE_ALPH
    );
    expect(predictionState.fields.epoch).toEqual(1n);
    expect(roundState.fields.totalAmountBoost).toEqual(10n * ONE_ALPH);
    expect(rewardBaseCalAmount).toEqual(amountUp);
    expect(rewardAmount).toEqual(297n * 10n ** 17n);
    expect(priceEnd).toEqual(11n);

    const arrayEpochBytes = arrayEpochToBytes([0]);

    await gameWithdraw(bidder1, game, 0n, arrayEpochBytes, bidder1.address);

    const bidder2Balance = await web3
      .getCurrentNodeProvider()
      .addresses.getAddressesAddressBalance(bidder2.address);

    await gameWithdraw(bidder2, game, 0n, arrayEpochBytes, bidder2.address);
    const bidder2BalanceAfterWithdraw = await web3
      .getCurrentNodeProvider()
      .addresses.getAddressesAddressBalance(bidder2.address);

    // round amount to get right amount
    expect((BigInt(bidder2Balance.balance) + ONE_ALPH) / 10n ** 17n).toEqual(
      BigInt(bidder2BalanceAfterWithdraw.balance) / 10n ** 17n
    );

    const roundStateWithdraw = await getRoundState(predictContractId, 0n);

    const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;
    const rewardBaseCalAmountWithdraw =
      roundStateWithdraw.fields.rewardBaseCalAmount;
    expect(treasuryAmount).toEqual(totalAmountWithdraw);

    //console.log(roundStateWithdraw.asset.alphAmount)
    expect(roundStateWithdraw.asset.alphAmount).toEqual(
      ONE_ALPH + totalAmountWithdraw
    );

    await gameDestroyRound(operator, game, 0n, arrayEpochBytes);
    await gameDestroyPrediction(operator, game, 0n);
    const exists = await contractExists(
      addressFromContractId(predictContractId)
    );
    expect(exists).toEqual(false);
  });

  test("try to create a game not operator", async () => {
    const bidder1 = bidders[0];

    await expectAssertionError(
      createGame(
        bidder1,
        game,
        100n,
        BigInt(bidDurationSecond * 1000),
        BigInt(10 * 1000)
      ),
      game.address,
      300
    );
  });

  test("try to start end round direct call", async () => {
    const bidder1 = bidders[0];

    await createGame(
      operator,
      game,
      100n,
      BigInt(0.5 * 1000),
      BigInt(10 * 1000)
    );
    const predictContractId = getSubPredictContractId(getPredictPath(0n));

    await gameStartRound(operator, game, 0n, 10n);
    await sleep(1 * 1000);

    await expectAssertionError(
      endRound(bidder1, getPredictObject(0n), 10n, true),
      addressFromContractId(predictContractId),
      3
    );

    
    await endRound(operator, getPredictObject(0n), 10n, true)
    const predictionState = await getPredictState(0n)

    expect(predictionState.fields.epoch).toEqual(1n)

  });

  test("try to withdraw by another address, wait and claim", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    // create a new prediction
    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt((bidDurationSecond + 3) * 1000)
    );

    const gameState = await game.fetchState();
    const numberGame = gameState.fields.gameCounter;
    expect(numberGame).toEqual(1n);
    const predictContractId = getSubPredictContractId(getPredictPath(0n));

    await gameStartRound(operator, game, 0n, 10n);
    await gameBid(bidder1, game, 0n, 9n * ONE_ALPH + ONE_ALPH, true);

    await sleep((bidDurationSecond + 1) * 1000);
    await gameEndRound(operator, game, 0n, 11n, true);

    const arrayEpochBytes = arrayEpochToBytes([0]);

    await expectAssertionError(
      gameWithdraw(bidder2, game, 0n, arrayEpochBytes, bidder1.address),
      addressFromContractId(predictContractId),
      10
    );

    await sleep((bidDurationSecond + 2) * 1000);
    await gameWithdraw(bidder2, game, 0n, arrayEpochBytes, bidder1.address);
  });

  test("try to destroy game not operator", async () => {
    const bidder1 = bidders[0];

    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt((bidDurationSecond + 3) * 1000)
    );

    await expectAssertionError(
      gameDestroyPrediction(bidder1, game, 0n),
      game.address,
      300
    );
  });

  test("try to destroy game where player still in", async () => {
    const bidder1 = bidders[0];
    const bidder2 = bidders[1];

    // create a new prediction
    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt((bidDurationSecond + 3) * 1000)
    );

    const gameState = await game.fetchState();
    const numberGame = gameState.fields.gameCounter;
    expect(numberGame).toEqual(1n);
    const predictContractId = getSubPredictContractId(getPredictPath(0n));

    await gameStartRound(operator, game, 0n, 10n);
    await gameBid(bidder1, game, 0n, 9n * ONE_ALPH + ONE_ALPH, true);
    await gameBid(bidder2, game, 0n, 9n * ONE_ALPH + ONE_ALPH, true);

    await sleep((bidDurationSecond + 1) * 1000);
    await gameEndRound(operator, game, 0n, 11n, true);

    const predictionState = await getPredictState(0n);
    expect(predictionState.fields.playerCounter).toEqual(2n);

    await expectAssertionError(
      gameDestroyRound(operator, game, 0n, arrayEpochToBytes([0])),
      addressFromContractId(
        getSubContractIdByContractId(predictContractId, getEpochPath(0n))
      ),
      101
    );

    await expectAssertionError(
      gameDestroyPrediction(operator, game, 0n),
      addressFromContractId(predictContractId),
      11
    );
  });

  test("change operator", async () => {
    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt((bidDurationSecond + 3) * 1000)
    );
    await gameStartRound(operator, game, 0n, 10n);
    const predictContract = getPredictObject(0n);

    //await changeInterval(operator, predictContract, 1000n)
    await changeOperator(operator, predictContract, ZERO_ADDRESS);
    const predictionState = await getPredictState(0n);

    expect(predictionState.fields.operator).toEqual(ZERO_ADDRESS);
  });

  test("change repeat every", async () => {
    await createGame(
      operator,
      game,
      100n,
      BigInt(bidDurationSecond * 1000),
      BigInt((bidDurationSecond + 3) * 1000)
    );
    await gameStartRound(operator, game, 0n, 10n);
    const predictContract = getPredictObject(0n);

    await changeInterval(operator, predictContract, 1000n);

    const predictionState = await getPredictState(0n);

    expect(predictionState.fields.repeatEvery).toEqual(1000n);
  });
});
