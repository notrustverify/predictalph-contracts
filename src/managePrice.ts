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
import { End, PredictPrice, Start } from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
  contractExists,
  getPrice,
  getRoundContractId,
  getRoundContractState,
} from "./utils";
import { CoinGeckoClient } from "coingecko-api-v3";




async function startRound(
  privKey: string,
  contractName: string,
  coin: string
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
  const predictPriceContractId = deployed.contractInstance.contractId;
  const predictPriceContractAddress = deployed.contractInstance.address;

  const predictionStates = await PredictPrice.at(
    predictPriceContractAddress
  ).fetchState();

  const roundContractId = getRoundContractId(
    predictPriceContractId,
    predictionStates.fields.epoch,
    wallet.group
  );

  const roundExist = await contractExists(
    addressFromContractId(roundContractId)
  );

  // dont continue, round already running
  if (roundExist) return;

  const price = await getPrice(cgClient, coin);
  const priceToStore = BigInt(Math.round(price * intPriceDivision)); //store it as a int

  try {
    const txStart = await Start.execute(wallet, {
      initialFields: {
        predict: predictPriceContractId,
        price: priceToStore,
      },
      attoAlphAmount: ONE_ALPH,
    });

    console.log(
      `Start round ${predictionStates.fields.epoch} ${txStart.txId}, price ${price}`
    );
    await waitTxConfirmed(nodeProvider, txStart.txId, 1, 1000);
    console.log("Start round done");
  } catch (error) {
    console.error(error);
    throw new Error(`error start round ${error}`)

  }
}

async function endRound(privKey: string, contractName: string, coin: string) {
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

  const deployed = deployments.getDeployedContractResult(
    group,
    contractName
  );
  const predictPriceContractId = deployed.contractInstance.contractId;
  const predictPriceContractAddress = deployed.contractInstance.address;

  const moveRound = async () => {
    const predictionStates = await PredictPrice.at(
      predictPriceContractAddress
    ).fetchState();

    const roundContractId = getRoundContractId(
      predictPriceContractId,
      predictionStates.fields.epoch,
      wallet.group
    );
    const roundExists = await contractExists(
      addressFromContractId(roundContractId)
    );

    let roundState = null;
    let endTimestamp = 0;

    if (roundExists) {
      roundState = await getRoundContractState(
        predictPriceContractId,
        predictionStates.fields.epoch,
        wallet.group
      );

      endTimestamp = Number(roundState.fields.bidEndTimestamp);

      try {
        if (Date.now() >= endTimestamp) {
          console.log(`locking for ${TIME_TO_WAIT_NEW_ROUND/(60*1000)} minutes`)
          await sleep(TIME_TO_WAIT_NEW_ROUND)
          const price = await getPrice(cgClient, coin);
          const priceToStore = BigInt(Math.round(price * intPriceDivision)); //store it as a int

          const txStart = await End.execute(wallet, {
            initialFields: {
              predict: predictPriceContractId,
              price: priceToStore,
              immediatelyStart: true
            },
            attoAlphAmount: ONE_ALPH,
          });
          console.log(
            `End round ${predictionStates.fields.epoch} ${txStart.txId} with price ${price}`
          );
          await waitTxConfirmed(nodeProvider, txStart.txId, 1, 1000);
          console.log("End round done");

          /*
          startRound(
            configuration.networks[networkToUse].privateKeys[group],
            "PredictPrice"
          );*/
        }
      } catch (error) {
        console.error(error);
        throw new Error(`error end round ${error}`)
      }
    }

    // setTimeout only accept 32bit value
    await sleep(4*1000);
    let timeUntilEnd = endTimestamp - Date.now();
    if (timeUntilEnd > 2 ** 31) timeUntilEnd = 2 ** 31 - 1;

    console.log(`Will end in ${new Date(endTimestamp)}`);
    setTimeout(moveRound, timeUntilEnd);
  };

  moveRound();
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
const TIME_TO_WAIT_NEW_ROUND = 0*1000

let networkToUse = process.argv.slice(2)[0];
const contractName = process.argv.slice(2)[1]
const coinName = process.argv.slice(2)[2]
//Select our network defined in alephium.config.ts

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);

//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

startRound(
  configuration.networks[networkToUse].privateKeys[0],
  contractName,
  coinName
);

endRound(
  configuration.networks[networkToUse].privateKeys[0],
  contractName,
  coinName
);
