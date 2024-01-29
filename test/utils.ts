import {
  Address,
  DUST_AMOUNT,
  ONE_ALPH,
  SignerProvider,
  groupOfAddress,
  subContractId,
  web3,
} from "@alephium/web3";
import {
  Round,
  Punter,
  PredictInstance,
  RoundInstance,
  PunterInstance,
  Start,
  End,
  Bid,
  Withdraw,
  DestroyRound,
  BoostRound,
  Predict,
  Game,
  CreateGame,
  GameInstance,
  GameStart,
  GameBid,
  GameBoost,
  GameEnd,
  GameWithdraw,
  GameDestroyRound,
  NewOperator,
  NewInterval,
  GameDestroyPrediction,
} from "../artifacts/ts";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import { testAddress, testPrivateKey } from "@alephium/web3-test";
import { waitTxConfirmed as _waitTxConfirmed } from "@alephium/cli";

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);
export const ZERO_ADDRESS = "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";
export const defaultSigner = new PrivateKeyWallet({
  privateKey: testPrivateKey,
});



export async function deployGame(
   operator: Address,
 ) {
   const punterTemplateId = await deployPunterTemplate();
   const roundTemplateId = await deployRoundTemplate();
   const predictTemplateId = await deployPrediction();

   return await Game.deploy(defaultSigner, {
     initialFields: {
        operator: operator,
        predictTemplateId: predictTemplateId.contractInstance.contractId,
        punterTemplateId: punterTemplateId.contractInstance.contractId,
        roundTemplateId: roundTemplateId.contractInstance.contractId,
        gameCounter: 0n
     },
   });
 }

export async function deployPrediction(
) {
  const punterTemplateId = await deployPunterTemplate();
  const roundTemplateId = await deployRoundTemplate();

  return await Predict.deploy(defaultSigner, {
    initialFields: {
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       epoch: 0n,
       operator: ZERO_ADDRESS,
       feesBasisPts: 0n,
       repeatEvery: 0n,
       claimedByAnyoneDelay: 0n,
       gameContract: "00",
       playerCounter: 0n
    },
  });
}


export async function deployPunterTemplate() {
  return await Punter.deploy(defaultSigner, {
    initialFields: {
      prediction: "00",
      punterAddress: ZERO_ADDRESS,
      epoch: 0n,
      upBid: false,
      amountBid: 0n,
      claimedByAnyoneAt: 0n,
    },
  });
}

export async function deployRoundTemplate() {
  return await Round.deploy(defaultSigner, {
    initialFields: {
      prediction: "00",
      epoch: 0n,
      priceStart: 0n,
      feesBasisPts: 0n,
      bidEndTimestamp: 0n,
      operator: ZERO_ADDRESS,
      rewardsComputed: false,
      priceEnd: 0n,
      totalAmount: 0n,
      amountUp: 0n,
      amountDown: 0n,
      treasuryAmount: 0n,
      rewardAmount: 0n,
      rewardBaseCalAmount: 0n,
      counterAttendees: 0n,
      totalAmountBoost: 0n,
    },
  });
}

export async function startRound(
  signer: SignerProvider,
  predictalph: PredictInstance,
  price: bigint
) {
  return await Start.execute(signer, {
    initialFields: { predict: predictalph.contractId, price: price },
    attoAlphAmount: ONE_ALPH,
  });
}


export async function gameStartRound(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   price: bigint
 ) {
   return await GameStart.execute(signer, {
     initialFields: {
        game: game.contractId,
        gameId: gameId,
        price: price,
     },
     attoAlphAmount: ONE_ALPH + DUST_AMOUNT,
   });
 }

export async function endRound(
  signer: SignerProvider,
  predictalph: PredictInstance,
  price: bigint,
  immediatelyStart: boolean
) {
  return await End.execute(signer, {
    initialFields: {
      predict: predictalph.contractId,
      price: price,
      immediatelyStart: immediatelyStart,
    },
    attoAlphAmount: ONE_ALPH,
  });
}

export async function gameEndRound(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   price: bigint,
   immediatelyStart: boolean
 ) {
   return await GameEnd.execute(signer, {
     initialFields: {
        game: game.contractId,
        price: price,
        immediatelyStart: immediatelyStart,
        gameId: gameId
     },
     attoAlphAmount: ONE_ALPH,
   });
 }

export async function bid(
  signer: SignerProvider,
  predictalph: PredictInstance,
  amount: bigint,
  up: boolean
) {
  return await Bid.execute(signer, {
    initialFields: {
      predict: predictalph.contractId,
      amount: amount,
      up: up,
    },
    attoAlphAmount: amount + 2n * DUST_AMOUNT,
  });
}

export async function gameBid(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   amount: bigint,
   up: boolean
 ) {
   return await GameBid.execute(signer, {
     initialFields: {
        game: game.contractId,
        amount: amount,
        up: up,
        gameId: 0n
     },
     attoAlphAmount: amount + 2n * DUST_AMOUNT,
   });
 }

export async function withdraw(
  signer: SignerProvider,
  predictalph: PredictInstance,
  epochParticipation: string,
  addressToClaim: string
) {
  return await Withdraw.execute(signer, {
    initialFields: {
      predict: predictalph.contractId,
      epochParticipation,
      addressToClaim,
    },
    attoAlphAmount: DUST_AMOUNT,
  });
}

export async function gameWithdraw(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   epochParticipation: string,
   addressToClaim: string
 ) {
   return await GameWithdraw.execute(signer, {
     initialFields: {
        game: game.contractId,
        gameId: gameId,
        epochParticipation,
        addressToClaim
     },
     attoAlphAmount: DUST_AMOUNT,
   });
 }

export async function destroyRound(
  signer: SignerProvider,
  predictalph: PredictInstance,
  epochArray
) {
  return await DestroyRound.execute(signer, {
    initialFields: {
      predict: predictalph.contractId,
      arrayEpoch: epochArray,
    },
    attoAlphAmount: DUST_AMOUNT,
  });
}


export async function gameDestroyRound(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   epochArray
 ) {
   return await GameDestroyRound.execute(signer, {
     initialFields: {
       game: game.contractId,
       gameId: gameId,
       arrayEpoch: epochArray,
      },
     attoAlphAmount: DUST_AMOUNT,
   });
}

export async function gameDestroyPrediction(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
 ) {
   return await GameDestroyPrediction.execute(signer, {
     initialFields: {
       game: game.contractId,
       gameId: gameId
     },
     attoAlphAmount: DUST_AMOUNT,
   });
 }


export async function boostRound(
  signer: SignerProvider,
  predictalph: PredictInstance,
  epoch: bigint,
  amount: bigint,
) {
  return await BoostRound.execute(signer, {
    initialFields: {
      predict: predictalph.contractId,
      amount: amount,
      epochToBoost: epoch,
    },
    attoAlphAmount: amount + DUST_AMOUNT,
  });
}

export async function gameBoostRound(
   signer: SignerProvider,
   game: GameInstance,
   gameId: bigint,
   epoch: bigint,
   amount: bigint,
 ) {
   return await GameBoost.execute(signer, {
     initialFields: {
        game: game.contractId,
        amount: amount,
        epochToBoost: epoch,
        gameId: gameId
     },
     attoAlphAmount: amount + DUST_AMOUNT,
   });
 }


export async function changeOperator(
   signer: SignerProvider,
   predict: PredictInstance,
   newOperator: string

){
   return await NewOperator.execute(signer, {
      initialFields : {
         predict: predict.contractId,
         newOperatorAddress: newOperator
      },
      attoAlphAmount: DUST_AMOUNT
   })
}


export async function changeInterval(
   signer: SignerProvider,
   predict: PredictInstance,
   newRecurrence: bigint

){
   return await NewInterval.execute(signer, {
      initialFields : {
         predict: predict.contractId,
         newRecurrence: newRecurrence
      },
      attoAlphAmount: DUST_AMOUNT
   })
}


export async function createGame(
   signer: SignerProvider,
   game: GameInstance,
   feesBasisPts: bigint,
   repeatEvery: bigint,
   claimedByAnyoneDelay: bigint
){
   return await CreateGame.execute(signer, {
      initialFields : {
         game: game.contractId,
         feesBasisPts: feesBasisPts,
         repeatEvery: repeatEvery,
         claimedByAnyoneDelay: claimedByAnyoneDelay
      },
      attoAlphAmount: ONE_ALPH + DUST_AMOUNT
   })
}

async function waitTxConfirmed<T extends { txId: string }>(
  promise: Promise<T>
): Promise<T> {
  const result = await promise;
  await _waitTxConfirmed(web3.getCurrentNodeProvider(), result.txId, 1, 1000);
  return result;
}

export async function transferAlphTo(to: Address, amount: bigint) {
  return await waitTxConfirmed(
    defaultSigner.signAndSubmitTransferTx({
      signerAddress: testAddress,
      destinations: [{ address: to, attoAlphAmount: amount }],
    })
  );
}

export async function contractExists(address: string): Promise<boolean> {
  try {
    const nodeProvider = web3.getCurrentNodeProvider();
    await nodeProvider.contracts.getContractsAddressState(address, {
      group: groupOfAddress(address),
    });
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("KeyNotFound")) {
      return false;
    }
    throw error;
  }
}

export function arrayEpochToBytes(arrayEpoch) {
  const buffer = Buffer.alloc(arrayEpoch.length * 4);
  arrayEpoch.forEach((value, index) => buffer.writeUInt32BE(value, index * 4));
  return buffer.toString("hex");
}
