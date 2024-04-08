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
import { End, EndChoice, PredictChoice, PredictPrice, Start, StartChoice } from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
  contractExists,
  getPrice,
  getRoundContractId,
  getRoundContractState,
} from "./utils";
import { CoinGeckoClient } from "coingecko-api-v3";
import { exit } from "process";




async function startRound(
  privKey: string,
  contractName: string
) {
  const wallet = new PrivateKeyWallet({
    privateKey: privKey,
    keyType: undefined,
    nodeProvider: web3.getCurrentNodeProvider(),
  });
  const group = wallet.group
  //.deployments contains the info of our `TokenFaucet` deployement, as we need to now the contractId and address
  //This was auto-generated with the `cli deploy` of our `scripts/0_deploy_faucet.ts`
  const deployments = await Deployments.from(
    "./artifacts/.deployments." + networkToUse + ".json"
  );
  //Make sure it match your address group
  const deployed = deployments.getDeployedContractResult(
    group,
    contractName
  );
  const predictContractId = deployed.contractInstance.contractId;
  const predictPriceContractAddress = deployed.contractInstance.address;

  const predictionStates = await PredictPrice.at(
    predictPriceContractAddress
  ).fetchState();

  const roundContractId = getRoundContractId(
    predictContractId,
    predictionStates.fields.epoch,
    wallet.group
  );

  const roundExist = await contractExists(
    addressFromContractId(roundContractId)
  );

  // dont continue, round already running
  if (roundExist){ 
   console.error("Round already running")
   return};

  try {
    const txStart = await StartChoice.execute(wallet, {
      initialFields: {
        predict: predictContractId,
      },
      attoAlphAmount: ONE_ALPH,
    });

    console.log(
      `Start round ${predictionStates.fields.epoch} ${txStart.txId}`
    );
    await waitTxConfirmed(nodeProvider, txStart.txId, 1, 1000);
    console.log("Start round done");
  } catch (error) {
    console.error(error);
    throw new Error(`error start round ${error}`)

  }
}

async function endRound(privKey: string, contractName: string, sideWon: boolean) {
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
  const group = wallet.group
  const immediatelyStart = false

  const deployed = deployments.getDeployedContractResult(
    group,
    contractName
  );
  const predictContractId = deployed.contractInstance.contractId;
  const predictPriceContractAddress = deployed.contractInstance.address;

  const moveRound = async () => {
    const predictionStates = await PredictChoice.at(
      predictPriceContractAddress
    ).fetchState();

    const roundContractId = getRoundContractId(
      predictContractId,
      predictionStates.fields.epoch,
      wallet.group,
    );

    const roundExists = await contractExists(
      addressFromContractId(roundContractId)
    );

    let roundState = null;
    let endTimestamp = 0;

    if (roundExists) {
      roundState = await getRoundContractState(
        predictContractId,
        predictionStates.fields.epoch,
        wallet.group,
        true
      );

      endTimestamp = Number(roundState.fields.bidEndTimestamp);

      try {
        if (Date.now() >= endTimestamp) {
          console.log(`locking for ${TIME_TO_WAIT_NEW_ROUND/(60*1000)} minutes`)
          await sleep(TIME_TO_WAIT_NEW_ROUND)

          const txStart = await EndChoice.execute(wallet, {
            initialFields: {
              predict: predictContractId,
              sideWon: sideWon,
              immediatelyStart: immediatelyStart
            },
            attoAlphAmount: ONE_ALPH,
          });
          console.log(
            `End round ${predictionStates.fields.epoch} ${txStart.txId} with side won ${sideWon}`
          );
          await waitTxConfirmed(nodeProvider, txStart.txId, 1, 1000);
          console.log("End round done");

          /*
          startRound(
            configuration.networks[networkToUse].privateKeys[group],
            "PredictPrice"
          );*/
        }else{
         console.log(`didnt end yet, end at ${new Date(endTimestamp)}`)
        }
      } catch (error) {
        console.error(error);
        throw new Error(`error end round ${error}`)
      }
    }

    if (immediatelyStart){
    // setTimeout only accept 32bit value
    await sleep(4*1000);
    let timeUntilEnd = endTimestamp - Date.now();
    if (timeUntilEnd > 2 ** 31) timeUntilEnd = 2 ** 31 - 1;

    console.log(`Will end in ${new Date(endTimestamp)}`);
    setTimeout(moveRound, timeUntilEnd);
    }
  };

  moveRound();
}

const retryFetch = fetchRetry.default(fetch, {
  retries: 10,
  retryDelay: 1000,
});


const intPriceDivision = 10_000;
const TIME_TO_WAIT_NEW_ROUND = 0

let networkToUse = process.argv.slice(2)[0];
const contractName = process.argv.slice(2)[1]
const action = process.argv.slice(2)[2]

if(action == "end" && process.argv.slice(2)[3] == undefined){
   console.error("Need value true or false for end")
   exit(-1)
}
const sideWon = process.argv.slice(2)[3] == 'true'

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
   case "start":
      startRound(
         configuration.networks[networkToUse].privateKeys[0],
         contractName
       );
      break;

   case "end":
      endRound(
         configuration.networks[networkToUse].privateKeys[0],
         contractName,
         sideWon
       );
      break;
   default:
      break;
}



