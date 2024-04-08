import {
  Address,
  DUST_AMOUNT,
  EventSubscribeOptions,
  ONE_ALPH,
  SignerProvider,
  addressFromContractId,
  groupOfAddress,
  subContractId,
  web3,
} from "@alephium/web3";
import {
  PredictPrice,
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
  PredictPriceTypes,
  PredictChoiceInstance,
  EndChoice,
  StartChoice,
  RoundChoice,
  BidChoice,
  WithdrawChoice,
} from "../artifacts/ts";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import { testAddress, testPrivateKey } from "@alephium/web3-test";
import { waitTxConfirmed as _waitTxConfirmed } from "@alephium/cli";
import { CoinGeckoClient } from "coingecko-api-v3";
import { RedisClient } from "ioredis/built/connectors/SentinelConnector/types";
import Redis from "ioredis";

web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);
export const ZERO_ADDRESS = "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";
export const defaultSigner = new PrivateKeyWallet({
  privateKey: testPrivateKey,
});

export async function deployPrediction(
  operator: Address,
  repeatEverySecond: number,
  epoch: bigint
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
      claimedByAnyoneDelay: 0n,
      title: "",
      playerCounter: 0n,
    },
  });
}

export async function deployPunterTemplate() {
  return await Punter.deploy(defaultSigner, {
    initialFields: {
      punterAddress: ZERO_ADDRESS,
      epoch: 0n,
      side: false,
      amountBid: 0n,
      claimedByAnyoneAt: 0n,
      predictionContractId: "00",
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
  predictalph: PredictPriceInstance | PredictChoiceInstance,
  price?: bigint
) {
  if (predictalph instanceof PredictPriceInstance) {
    return await Start.execute(signer, {
      initialFields: { predict: predictalph.contractId, price: price },
      attoAlphAmount: ONE_ALPH,
    });
  } else if (predictalph instanceof PredictChoiceInstance) {
    return await StartChoice.execute(signer, {
      initialFields: { predict: predictalph.contractId },
      attoAlphAmount: ONE_ALPH,
    });
  }
}

export async function endRoundAction(
  signer: SignerProvider,
  predictalph: PredictPriceInstance | PredictChoiceInstance,
  price: bigint,
  immediatelyStart: boolean,
  sideWon?: boolean
) {
  if (predictalph instanceof PredictPriceInstance) {
    return await End.execute(signer, {
      initialFields: {
        predict: predictalph.contractId,
        price: price,
        immediatelyStart: immediatelyStart,
      },
      attoAlphAmount: ONE_ALPH,
    });
  } else if (predictalph instanceof PredictChoiceInstance) {
    return await EndChoice.execute(signer, {
      initialFields: {
        predict: predictalph.contractId,
        sideWon: sideWon,
        immediatelyStart: immediatelyStart,
      },
      attoAlphAmount: ONE_ALPH,
    });
  }
}


export async function destroyRound(
  signer: SignerProvider,
  predictalph: PredictPriceInstance,
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

export async function getRoundContractState(
  predictAlphContractId: string,
  epoch: bigint,
  groupIndex: number,
  isChoiceContract?: boolean
) {
  const roundContractId = getRoundContractId(
    predictAlphContractId,
    epoch,
    groupIndex
  );

  let roundContract = undefined
  roundContract = Round.at(addressFromContractId(roundContractId));
  if(isChoiceContract)
   roundContract = RoundChoice.at(addressFromContractId(roundContractId));

  const state = await roundContract.fetchState();
  return state;
}

export function getRoundContractId(
  predictAlphContractId: string,
  epoch: bigint,
  groupIndex: number
) {
  return subContractId(predictAlphContractId, getEpochPath(epoch), groupIndex);
}

function getEpochPath(epoch: bigint) {
  return "00" + epoch.toString(16).padStart(8, "0");
}

export async function getPrice(cgClient: CoinGeckoClient, id: string) {
  const alphCoinGecko = await cgClient.simplePrice({
    vs_currencies: "usd",
    ids: id.toLowerCase(),
  });
  if (alphCoinGecko[id]["usd"] <= 0) {
    throw new Error("Price is not correct");
  }

  return (
    Math.round((alphCoinGecko[id]["usd"] + Number.EPSILON) * 1000) / 1000
  );
}

export async function bid(
   signer: SignerProvider,
   contractId: string,
   amount: bigint,
   up: boolean,
   type: string
 ) {
   if (type.toLowerCase() == "predictprice" ) {
     return await BidPrice.execute(signer, {
       initialFields: {
         predict: contractId,
         amount: amount,
         side: up,
       },
       attoAlphAmount: amount + 2n * DUST_AMOUNT,
     });
   } else if (type.toLowerCase() == "predictchoice" ) {
     return await BidChoice.execute(signer, {
       initialFields: {
         predict: contractId,
         amount: amount,
         side: up,
       },
       attoAlphAmount: amount + 2n * DUST_AMOUNT,
     });
   }
 }

 export async function withdraw(
   signer: SignerProvider,
   contractId: string,
   arrayEpoch: string,
   addressToClaim: string,
   type: string
 ) {
   if (type.toLowerCase() == "predictprice" ) {
     return await WithdrawPrice.execute(signer, {
       initialFields: {
          predict: contractId,
          epochParticipation: arrayEpoch,
          addressToClaim: addressToClaim
       },
       attoAlphAmount: 2n * DUST_AMOUNT,
     });
   } else if (type.toLowerCase() == "predictchoice" ) {
     return await WithdrawChoice.execute(signer, {
       initialFields: {
          predict: contractId,
          epochParticipation: arrayEpoch,
          addressToClaim: addressToClaim
       },
       attoAlphAmount: 2n * DUST_AMOUNT,
     });
   }
 }