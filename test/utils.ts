import {
  Address,
  DUST_AMOUNT,
  ONE_ALPH,
  SignerProvider,
  binToHex,
  groupOfAddress,
  web3,
} from "@alephium/web3";
import {
  PredictPrice,
  PredictChoice,
  Round,
  Punter,
  PredictPriceInstance,
  RoundInstance,
  PunterInstance,
  Start,
  End,
  BidPrice,
  WithdrawPrice,
  DestroyRound,
  BoostRound,
  PredictChoiceInstance,
  BidChoice,
  WithdrawChoice,
  StartChoice,
  EndChoice,
  RoundChoice,
  BoostRoundChoice,
} from "../artifacts/ts";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import { testAddress, testPrivateKey } from "@alephium/web3-test";
import { waitTxConfirmed as _waitTxConfirmed } from "@alephium/cli";

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);
export const ZERO_ADDRESS = "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";
export const defaultSigner = new PrivateKeyWallet({
  privateKey: testPrivateKey,
});

const isType = <Type>(thing: any): thing is Type => true;

export async function deployPrediction(
  operator: Address,
  repeatEverySecond: number,
  epoch: bigint,
  title: string
) {
  const punterTemplateId = await deployPunterTemplate();
  const roundTemplateId = await deployRoundTemplate();
  return await PredictPrice.deploy(defaultSigner, {
    initialFields: {
      punterTemplateId: punterTemplateId.contractInstance.contractId,
      roundTemplateId: roundTemplateId.contractInstance.contractId,
      epoch: epoch,
      operator: operator,
      feesBasisPts: 100n,
      repeatEvery: BigInt(repeatEverySecond * 1000),
      claimedByAnyoneDelay: BigInt(1 * 1000),
      title: binToHex(new TextEncoder().encode(title)),
      playerCounter: 0n,
    },
  });
}

export async function deployPredictionChoice(
   operator: Address,
   repeatEverySecond: number,
   epoch: bigint,
   title: string
 ) {
   const punterTemplateId = await deployPunterTemplate();
   const roundTemplateId = await deployRoundChoiceTemplate();
   return await PredictChoice.deploy(defaultSigner, {
     initialFields: {
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       epoch: epoch,
       operator: operator,
       feesBasisPts: 100n,
       repeatEvery: BigInt(repeatEverySecond * 1000),
       claimedByAnyoneDelay: BigInt(1 * 1000),
       title: binToHex(new TextEncoder().encode(title)),
       playerCounter: 0n,
     },
   });
 }

export async function deployPunterTemplate() {
  return await Punter.deploy(defaultSigner, {
    initialFields: {
      predictionContractId: "00",
      punterAddress: ZERO_ADDRESS,
      epoch: 0n,
      side: false,
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

export async function deployRoundChoiceTemplate() {
   return await RoundChoice.deploy(defaultSigner, {
     initialFields: {
        prediction: "00",
        epoch: 0n,
        feesBasisPts: 0n,
        bidEndTimestamp: 0n,
        operator: ZERO_ADDRESS,
        rewardsComputed: false,
        totalAmount: 0n,
        treasuryAmount: 0n,
        rewardAmount: 0n,
        rewardBaseCalAmount: 0n,
        counterAttendees: 0n,
        totalAmountBoost: 0n,
        sideWon: false,
        amountTrue: 0n,
        amountFalse: 0n
     },
   });
 }

export async function startRound(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  price?: bigint
) {
  if (predict instanceof PredictPriceInstance) {
    return await Start.execute(signer, {
      initialFields: { predict: predict.contractId, price: price },
      attoAlphAmount: ONE_ALPH,
    });
  } else if (predict instanceof PredictChoiceInstance) {
    return await StartChoice.execute(signer, {
      initialFields: { predict: predict.contractId },
      attoAlphAmount: ONE_ALPH,
    });
  }
}

export async function endRound(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  price: bigint,
  immediatelyStart: boolean,
  sideWon?: boolean
) {
  if (predict instanceof PredictPriceInstance) {
    return await End.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        price: price,
        immediatelyStart: immediatelyStart,
      },
      attoAlphAmount: ONE_ALPH,
    });
  } else if (predict instanceof PredictChoiceInstance) {
    return await EndChoice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        sideWon: sideWon,
        immediatelyStart: immediatelyStart,
      },
      attoAlphAmount: ONE_ALPH,
    });
  }
}

export async function bid(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  amount: bigint,
  up: boolean
) {
  if (predict instanceof PredictPriceInstance) {
    return await BidPrice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        amount: amount,
        side: up,
      },
      attoAlphAmount: amount + 2n * DUST_AMOUNT,
    });
  } else if (predict instanceof PredictChoiceInstance) {
    return await BidChoice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        amount: amount,
        side: up,
      },
      attoAlphAmount: amount + 2n * DUST_AMOUNT,
    });
  }
}

export async function withdraw(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  epochParticipation: string,
  addressToClaim: string
) {
  if (predict instanceof PredictPriceInstance) {
    return await WithdrawPrice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        epochParticipation,
        addressToClaim: addressToClaim,
      },
      attoAlphAmount: DUST_AMOUNT,
    });
  } else if (predict instanceof PredictChoiceInstance) {
    return await WithdrawChoice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        epochParticipation,
        addressToClaim: addressToClaim,
      },
      attoAlphAmount: 2n*DUST_AMOUNT,
    });
  }
}

export async function destroyRound(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  epochArray
) {
   if(predict instanceof PredictPriceInstance){
  return await DestroyRound.execute(signer, {
    initialFields: {
      predict: predict.contractId,
      arrayEpoch: epochArray,
    },
    attoAlphAmount: DUST_AMOUNT,
  });} else if(predict instanceof PredictChoiceInstance){
   return await DestroyRound.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        arrayEpoch: epochArray,
      },
      attoAlphAmount: DUST_AMOUNT,
    });
  }
}

export async function boostRound(
  signer: SignerProvider,
  predict: PredictPriceInstance | PredictChoiceInstance,
  epoch: bigint,
  amount: bigint,
  up: boolean
) {
   if(predict instanceof PredictPriceInstance){
  return await BoostRound.execute(signer, {
    initialFields: {
      predict: predict.contractId,
      amount: amount,
      epochToBoost: epoch,
    },
    attoAlphAmount: amount + DUST_AMOUNT,
  });} else if (predict instanceof PredictChoiceInstance){
   return await BoostRoundChoice.execute(signer, {
      initialFields: {
        predict: predict.contractId,
        amount: amount,
        epochToBoost: epoch,
      },
      attoAlphAmount: amount + DUST_AMOUNT,
    });
  }
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
    await nodeProvider.contracts.getContractsAddressState(address);
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
