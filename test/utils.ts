import {
  Address,
  DUST_AMOUNT,
  ONE_ALPH,
  SignerProvider,
  groupOfAddress,
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
   repeatEverySecond: number,
   epoch: bigint
 ) {
   const punterTemplateId = await deployPunterTemplate();
   const roundTemplateId = await deployRoundTemplate();
   const predictTemplateId = await deployPrediction(operator, repeatEverySecond, epoch);

   return await Game.deploy(defaultSigner, {
     initialFields: {
        operator: operator,
        feesBasisPts: 100n,
        repeatEvery: BigInt(repeatEverySecond * 1000),
        claimedByAnyoneDelay: BigInt(1 * 1000),
        predictTemplateId: predictTemplateId.contractInstance.contractId,
        punterTemplateId: punterTemplateId.contractInstance.contractId,
        roundTemplateId: roundTemplateId.contractInstance.contractId,
        gameCounter: 0n
     },
   });
 }

export async function deployPrediction(
  operator: Address,
  repeatEverySecond: number,
  epoch: bigint
) {
  const punterTemplateId = await deployPunterTemplate();
  const roundTemplateId = await deployRoundTemplate();

  return await Predict.deploy(defaultSigner, {
    initialFields: {
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       epoch: epoch,
       operator: operator,
       feesBasisPts: 100n,
       repeatEvery: BigInt(repeatEverySecond * 1000),
       claimedByAnyoneDelay: BigInt(1 * 1000),
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
  predictalph: PredictalphInstance,
  price: bigint
) {
  return await Start.execute(signer, {
    initialFields: { predictalph: predictalph.contractId, price: price },
    attoAlphAmount: ONE_ALPH,
  });
}

export async function endRound(
  signer: SignerProvider,
  predictalph: PredictalphInstance,
  price: bigint,
  immediatelyStart: boolean
) {
  return await End.execute(signer, {
    initialFields: {
      predictalph: predictalph.contractId,
      price: price,
      immediatelyStart: immediatelyStart,
    },
    attoAlphAmount: ONE_ALPH,
  });
}

export async function bid(
  signer: SignerProvider,
  predictalph: PredictalphInstance,
  amount: bigint,
  up: boolean
) {
  return await Bid.execute(signer, {
    initialFields: {
      predictalph: predictalph.contractId,
      amount: amount,
      up: up,
    },
    attoAlphAmount: amount + 2n * DUST_AMOUNT,
  });
}

export async function withdraw(
  signer: SignerProvider,
  predictalph: PredictalphInstance,
  epochParticipation: string,
  addressToClaim: string
) {
  return await Withdraw.execute(signer, {
    initialFields: {
      predictalph: predictalph.contractId,
      epochParticipation,
      addressToClaim,
    },
    attoAlphAmount: DUST_AMOUNT,
  });
}

export async function destroyRound(
  signer: SignerProvider,
  predictalph: PredictalphInstance,
  epochArray
) {
  return await DestroyRound.execute(signer, {
    initialFields: {
      predictalph: predictalph.contractId,
      arrayEpoch: epochArray,
    },
    attoAlphAmount: DUST_AMOUNT,
  });
}

export async function boostRound(
  signer: SignerProvider,
  predictalph: PredictalphInstance,
  epoch: bigint,
  amount: bigint,
  up: boolean
) {
  return await BoostRound.execute(signer, {
    initialFields: {
      predictalph: predictalph.contractId,
      amount: amount,
      epochToBoost: epoch,
    },
    attoAlphAmount: amount + DUST_AMOUNT,
  });
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
