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
  Predict,
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
  PredictTypes,
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

function getSubPredictContractId(rootContractId: string, path: string, groupIndex: number) {
   return subContractId(rootContractId, path, groupIndex);
 }

function getSubContractIdByContractId(contractId: string, path: string, groupIndex: number) {
   return subContractId(contractId, path, groupIndex);
 }

function getPredictPath(gameId: bigint) {
   return "03" + gameId.toString(16).padStart(8, "0");
 }

 export function getPredictObject(rootContractId: string, gameId: bigint, groupIndex: number) {
   const contractId = getSubPredictContractId(rootContractId,getPredictPath(gameId), groupIndex);

   return Predict.at(addressFromContractId(contractId));
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

export async function withdraw(
  signer: SignerProvider,
  predictalph: PredictInstance,
  epochParticipation: string,
  addressToClaim: string
) {
  return await Withdraw.execute(signer, {
    initialFields: { predict: predictalph.contractId, epochParticipation, addressToClaim: addressToClaim },
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

export async function getRoundContractState(
  predictAlphContractId: string,
  epoch: bigint,
  groupIndex: number
) {
  const roundContractId = getRoundContractId(
    predictAlphContractId,
    epoch,
    groupIndex
  );

  const roundContract = Round.at(addressFromContractId(roundContractId));
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

export async function getPrice(cgClient: CoinGeckoClient) {
  const alphCoinGecko = await cgClient.simplePrice({
    vs_currencies: "usd",
    ids: "alephium",
  });
  if (alphCoinGecko.alephium.usd <= 0) {
    throw new Error("Price is not correct");
  }

  return (
    Math.round((alphCoinGecko.alephium.usd + Number.EPSILON) * 1000) / 1000
  );
}

export function getAddressesNotClaim(redis: Redis, round: number) {
}

