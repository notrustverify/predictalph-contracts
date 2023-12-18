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
  withdraw,
} from "./utils";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import * as base58 from 'bs58'

describe("unit tests", () => {
  // Use the correct host and port
  web3.setCurrentNodeProvider("http://127.0.0.1:22973");

  const groupIndex = groupOfAddress(testAddress);
  const bidDuration = 10 * 1000;
  jest.setTimeout(3*1000*60)
  let predictionGame: PredictalphInstance;
  let round: RoundInstance;
  let punter: PunterInstance;
  let bidders: PrivateKeyWallet[];
  let operator: PrivateKeyWallet;


  function getSubContractId(path: string){
    console.log(path)

      return subContractId(predictionGame.contractId, path, groupIndex)
    }
  

    async function checkRoundState(epoch: bigint, amount: bigint) {

      const roundContractId = getSubContractId('00'+epoch.toString(16).padStart(8, '0'))
      const roundContract = Round.at(addressFromContractId(roundContractId))
      const state = await roundContract.fetchState()
      
      expect(state.asset.alphAmount).toEqual(amount + ONE_ALPH)
      expect(state.fields.epoch).toEqual(epoch)
    }

    async function getRoundState(epoch: bigint) {

      const roundContractId = getSubContractId('00'+epoch.toString(16).padStart(8, '0'))
      const roundContract = Round.at(addressFromContractId(roundContractId))
      const state = await roundContract.fetchState()
      return state
    }

    async function getRoundBidder(address: Address,epoch: bigint) {

      const bidderContractId = getSubContractId('01'+base58.decode(address)+epoch.toString(16).padStart(4, '0'))
      const bidderContract = Round.at(addressFromContractId(bidderContractId))
      const state = await bidderContract.fetchState()
      return state
    }


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
    const bidder1 = bidders[0]
    const bidder2 = bidders[1]

    console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);

    //create contract
    await bid(bidder1, predictionGame, 2n*ONE_ALPH, true);
    //play
    //await bid(bidder1, predictionGame, 10n*ONE_ALPH, true);

    //create contract
    await bid(bidder2, predictionGame, 3n*ONE_ALPH, false);

    await endRound(operator, predictionGame, 10n);

    const predictionState = await predictionGame.fetchState()

    expect(predictionState.fields.epoch).toEqual(1n)
    
  });



  test("create round, bid, withdraw", async () => {
    const bidder1 = bidders[0]
    const bidder2 = bidders[1]

    console.log("Game contract id", predictionGame.contractId);
    await startRound(operator, predictionGame, 10n);
    await bid(bidder1, predictionGame, 9n*ONE_ALPH+ONE_ALPH, true);
    await bid(bidder2, predictionGame, 11n*ONE_ALPH+ONE_ALPH, false);

    await endRound(operator, predictionGame, 11n);

    const predictionState = await predictionGame.fetchState()
    const roundState = await getRoundState(0n)
    const amountDown = roundState.fields.amountDown
    const amountUp = roundState.fields.amountUp
    const totalAmount = roundState.fields.totalAmount
    const treasuryAmount = roundState.fields.treasuryAmount

    const bidder1State = getRoundBidder(bidder1.address,0n)
    console.log(bidder1State)

    expect(amountUp).toEqual(9n*ONE_ALPH)
    expect(amountDown).toEqual(11n*ONE_ALPH)
    expect(totalAmount).toEqual(20n*ONE_ALPH)
    expect(treasuryAmount).toEqual(20n*10n**16n)
    expect(roundState.asset.alphAmount).toEqual(21n * ONE_ALPH)
    expect(predictionState.fields.epoch).toEqual(1n)


    await withdraw(bidder1, predictionGame,'00')


  });

});
