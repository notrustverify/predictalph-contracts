import {
  web3,
  Project,
  addressFromContractId,
  groupOfAddress,
  Address,
  ONE_ALPH,
  sleep,
  subContractId,
} from "@alephium/web3";
import { randomContractId, testAddress } from "@alephium/web3-test";
import {
  Predictalph,
  Round,
  Punter,
  PredictalphInstance,
  RoundInstance,
  PunterInstance,
  Bid,
} from "../artifacts/ts";
import {
  deployPrediction,
  startRound,
  endRound,
  transferAlphTo,
  bid,
  contractExists,
} from "./utils";
import { PrivateKeyWallet } from "@alephium/web3-wallet";

describe("unit tests", () => {
  // Use the correct host and port
  web3.setCurrentNodeProvider("http://127.0.0.1:22973");

  const groupIndex = groupOfAddress(testAddress);
  const bidDuration = 10 * 1000;

  let predictionGame: PredictalphInstance;
  let round: RoundInstance;
  let punter: PunterInstance;
  let bidders: PrivateKeyWallet[];
  let operator: PrivateKeyWallet;

  beforeEach(async () => {
    operator = PrivateKeyWallet.Random(groupIndex);
    predictionGame = (await deployPrediction(operator.address, 1, 0n))
      .contractInstance;
    bidders = Array.from(Array(2).keys()).map((_) =>
      PrivateKeyWallet.Random(groupIndex)
    );

    for (const bidder of bidders) {
      await transferAlphTo(bidder.address, 100n*ONE_ALPH)
    }

    await transferAlphTo(operator.address, 100n * ONE_ALPH);
  });


  test("create round, end it", async () => {
    const predictionState = await predictionGame.fetchState()
    console.log(predictionState)
    console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //await bid(bidders[0], predictionGame, 10n, true);
    await endRound(operator, predictionGame, 10n);
  });
});
