import { Deployments, waitTxConfirmed } from "@alephium/cli";
import {
  DUST_AMOUNT,
  web3,
  Project,
  NodeProvider,
  SignerProvider,
  Contract,
  ONE_ALPH,
  sleep,
  addressFromContractId,
  EventSubscribeOptions,
  binToHex,
  hexToString,
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import configuration from "../alephium.config";
import {
  DestroyRound,
  End,
  NewInterval,
  Predict,
  Start,
  CreateGame,
  GameInstance,
  GameTypes,
  Game,
} from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
  arrayEpochToBytes,
  contractExists,
  getPredictObject,
  getPrice,
  getRoundContractId,
  getRoundContractState,
} from "./utils";
import { CoinGeckoClient } from "coingecko-api-v3";
import { access } from "fs";

async function newPredict(
  privKey: string,
  contractName: string,
  repeatEvery: bigint,
  claimedByAnyoneDelay: bigint,
  title: string
) {
  const wallet = new PrivateKeyWallet({
    privateKey: privKey,
    keyType: undefined,
    nodeProvider: web3.getCurrentNodeProvider(),
  });

  //.deployments contains the info of our `TokenFaucet` deployement, as we need to now the contractId and address
  //This was auto-generated with the `cli deploy` of our `scripts/0_deploy_faucet.ts`
  const deployments = await Deployments.from(
    "./artifacts/.deployments." + networkToUse + ".json"
  );
  //Make sure it match your address group
  const group = wallet.group;
  const deployed = deployments.getDeployedContractResult(group, contractName);

  const gameContractId = deployed.contractInstance.contractId;
  const gameContractAddress = deployed.contractInstance.address;

  try {
    const tx = await CreateGame.execute(wallet, {
      initialFields: {
        game: gameContractId,
        feesBasisPts: 100n,
        repeatEvery: repeatEvery * 1000n,
        claimedByAnyoneDelay: claimedByAnyoneDelay * 1000n,
        title: binToHex(new TextEncoder().encode(title)),
      },
      attoAlphAmount: ONE_ALPH,
    });
    console.log(`wait on ${tx.txId}`);
    await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);

    const gameStates = await Game.at(
      gameContractAddress
    ).fetchState();
    console.log(gameStates.fields);

    const predictGame = getPredictObject(
      gameContractId,
      gameStates.fields.gameCounter-1n,
      wallet.account.group
    );
    const predictStates = await predictGame.fetchState();
    console.log(
      `Predict ${hexToString(predictStates.fields.title)} contract id: ${predictGame.contractId}, address: ${predictGame.address}`
    );
  } catch (error) {
    console.error(error);
  }
}

const retryFetch = fetchRetry.default(fetch, {
  retries: 10,
  retryDelay: 1000,
});

const cgClient = new CoinGeckoClient({
  timeout: 10000,
  autoRetry: true,
});

const intPriceDivision = 10_000;

let networkToUse = process.argv.slice(2)[0];
let action = process.argv.slice(2)[1];
let newParameter = process.argv.slice(2)[2];
//if (networkToUse === undefined) networkToUse = "mainnet";

if (process.argv.length > 3) console.error("parameters empty");

//Select our network defined in alephium.config.ts

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);

//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

const ONE_WEEK_SEC = 604800n;
const ONE_DAY_SEC = 86400n;
const ONE_HOUR_SEC = 3600n;

newPredict(
  configuration.networks[networkToUse].privateKeys[0],
  "Game",
  ONE_HOUR_SEC,
  ONE_WEEK_SEC,
  "First Event2"
);
