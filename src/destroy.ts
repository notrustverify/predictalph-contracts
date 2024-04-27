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
import {
  DestroyPredict,
  DestroyRound,
  End,
  PredictChoice,
  PredictMultipleChoice,
  PredictPrice,
  Start,
} from "../artifacts/ts";
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
import { Sequelize } from "sequelize";

async function destroyRound(
  privKey: string,
  contractName: string,
  arrayRound: number[]
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
  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;

  let predictionStates;

  if (contractName.split(":")[0].toLowerCase() == "price") {
    predictionStates = await PredictPrice.at(
      predictalphContractAddress
    ).fetchState();
  } else if (contractName.split(":")[0].toLowerCase() == "predictchoice") {
    predictionStates = await PredictChoice.at(
      predictalphContractAddress
    ).fetchState();
    //isChoiceContract = true;
  } else if (
    contractName.split(":")[0].toLowerCase() == "predictmultiplechoice"
  ) {
    predictionStates = await PredictMultipleChoice.at(
      predictalphContractAddress
    ).fetchState();
    //isMultipleChoiceContract = true;
  }

  const onlyRoundExists = [];

  for (const epoch of arrayRound) {
    const roundContractId = getRoundContractId(
      predictalphContractId,
      BigInt(epoch),
      wallet.group
    );

    const roundExist = await contractExists(
      addressFromContractId(roundContractId)
    );

    if (roundExist && epoch !== Number(predictionStates?.fields.epoch)) {
      const getRoundState = await getRoundContractState(
        predictalphContractId,
        BigInt(epoch),
        group
      );
      if (getRoundState.fields.counterAttendees <= 0)
        onlyRoundExists.push(epoch);
      else
        console.log(
          `Round ${epoch}, ${getRoundState.fields.counterAttendees} attendees left`
        );
    }
  }

  if (onlyRoundExists.length > 0) {
    try {
      let chunkSize = 15;
      for (let i = 0; i < onlyRoundExists.length; i += chunkSize) {
        let chunk = onlyRoundExists.slice(i, i + chunkSize);
        const tx = await DestroyRound.execute(wallet, {
          initialFields: {
            predict: predictalphContractId,
            arrayEpoch: arrayEpochToBytes(chunk),
          },
          attoAlphAmount: ONE_ALPH,
        });

        console.log(`Destroy round ${chunk} ${tx.txId}`);
        //await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
        console.log("Destroy rounds done");
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    console.log("nothing to DESTROY");
  }
}

async function destroyPredict(
  privKey: string,
  contractName: string,
  arrayRound: number[]
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
  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;

  let predictionStates;

  if (contractName.split(":")[0].toLowerCase() == "price") {
    predictionStates = await PredictPrice.at(
      predictalphContractAddress
    ).fetchState();
  } else if (contractName.split(":")[0].toLowerCase() == "predictchoice") {
    predictionStates = await PredictChoice.at(
      predictalphContractAddress
    ).fetchState();
    //isChoiceContract = true;
  } else if (
    contractName.split(":")[0].toLowerCase() == "predictmultiplechoice"
  ) {
    predictionStates = await PredictMultipleChoice.at(
      predictalphContractAddress
    ).fetchState();
    //isMultipleChoiceContract = true;
  }

  const numPlayer = predictionStates.fields.playerCounter;
  if (predictionStates.fields.playerCounter > 0) {
    console.log(`${numPlayer} still on round`);
    return;
  }

  const tx = await DestroyPredict.execute(wallet, {
    initialFields: {
      predict: predictalphContractId,
    },
    attoAlphAmount: ONE_ALPH,
  });

  console.log(
    `Destroy predict game ${predictionStates.fields.title} ${tx.txId}`
  );
  await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
  console.log("Destroy done");
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
if (networkToUse === undefined) networkToUse = "mainnet";
//Select our network defined in alephium.config.ts

const action = process.argv.slice(2)[1];
const contractName = process.argv.slice(2)[2];

const roundArrayToDestroyFrom = parseInt(process.argv.slice(2)[3]);
const roundArrayToDestroyTo = parseInt(process.argv.slice(2)[4]);

if (roundArrayToDestroyFrom == undefined)
  throw new Error("Missing array with round to destroy");

let arrayRound = [];
arrayRound = Array.from(
  { length: roundArrayToDestroyTo - roundArrayToDestroyFrom + 1 },
  (_, index) => roundArrayToDestroyFrom + index
);

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);
//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

switch (action) {
  case "round":
    destroyRound(
      configuration.networks[networkToUse].privateKeys[0],
      contractName,
      arrayRound
    );
    break;

  case "predict":
    destroyPredict(
      configuration.networks[networkToUse].privateKeys[0],
      contractName,
      arrayRound
    );
    break;
  default:
    break;
}
