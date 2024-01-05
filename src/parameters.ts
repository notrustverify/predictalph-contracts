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
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import configuration from "../alephium.config";
import { DestroyRound, End, NewInterval, Predictalph, Start } from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
    arrayEpochToBytes,
  contractExists,
  getPrice,
  getRoundContractId,
  getRoundContractState,
} from "./utils";
import { CoinGeckoClient } from "coingecko-api-v3";
import { access } from "fs";

async function newInterval(
  privKey: string,
  contractName: string,
  newIntervalSecond: bigint
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
  const deployed = deployments.getDeployedContractResult(
    group,
    contractName
  );
  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;

  const predictionStates = await Predictalph.at(
    predictalphContractAddress
  ).fetchState();

  try {
    const tx = await NewInterval.execute(wallet, {
      initialFields: {
        predictalph: predictalphContractId,
        newRecurrence: newIntervalSecond*1000n
      },
      attoAlphAmount: ONE_ALPH,
    });

    console.log(
      `new recurrence ${newIntervalSecond/60n} minutes ${tx.txId}`
    );
    await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
    console.log("New recurrence is set");
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

if (process.argv.length > 3) console.error("parameters empty")

//Select our network defined in alephium.config.ts

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);

//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

switch (action) {
    case "interval":
        newInterval(
            configuration.networks[networkToUse].privateKeys[0],
            "Predictalph",
            BigInt(parseInt(newParameter))
          );
        break;

    default:
        break;
}



