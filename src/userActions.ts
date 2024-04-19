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
   BoostRound,
  DestroyRound,
  End,
  NewInterval,
  PredictPrice,
  PredictPriceInstance,
  Start,
} from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
  arrayEpochToBytes,
  bid,
  boost,
  contractExists,
  getPrice,
  getRoundContractId,
  getRoundContractState,
  withdraw,
} from "./utils";
import { CoinGeckoClient } from "coingecko-api-v3";

async function userBid(
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
  const deployed = deployments.getDeployedContractResult(group, contractName);

  const contractType = contractName.split(":")[0].toLowerCase();

  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;

  if(contractType == "predictmultiplechoice"){
   try {
      const tx = await bid(
        wallet,
        predictalphContractId,
        newIntervalSecond * ONE_ALPH,
        2n,
        contractType
      );
  
      console.log(
        `bid ${newIntervalSecond} ALPH from ${wallet.address} - ${tx.txId} - ${predictalphContractAddress}`
      );
      await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
      console.log("New bid is set");
    } catch (error) {
      console.error(error);
    }

  }else{
   try {
      const tx = await bid(
        wallet,
        predictalphContractId,
        newIntervalSecond * ONE_ALPH,
        true,
        contractType
      );
  
      console.log(
        `bid ${newIntervalSecond} ALPH from ${wallet.address} - ${tx.txId} - ${predictalphContractAddress}`
      );
      await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
      console.log("New bid is set");
    } catch (error) {
      console.error(error);
    }
  }


 
}

async function userClaim(privKey: string, contractName: string) {
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

  const predictionStates = await PredictPrice.at(
    predictalphContractAddress
  ).fetchState();

  try {
    const tx = await withdraw(
      wallet,
      predictalphContractId,
      arrayEpochToBytes([6]),
      wallet.address,
      "predictprice"
    );
    console.log(
      `withdraw from ${wallet.address} - ${tx.txId} - ${predictalphContractAddress}`
    );
    await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
  } catch (error) {
    console.error(error);
  }
}


async function boostRound(privKey: string, contractName: string, amount: bigint,epochToBoost: bigint) {
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
 
   try {
     const tx = await boost(
       wallet,
       predictalphContractId,
       amount*ONE_ALPH,
       epochToBoost,
       contractName.split(":")[0]
       );
     console.log(
       `boost round ${amount} ALPH - ${tx.txId} - Contract Address: ${predictalphContractAddress}`
     );
     await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
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
let contractName = process.argv.slice(2)[1];
let action = process.argv.slice(2)[2];
let amountBet = process.argv.slice(2)[3];
let epoch = process.argv.slice(2)[4];

//if (networkToUse === undefined) networkToUse = "mainnet";

if (process.argv.length < 3) console.error("parameters empty");

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
  case "bid":
    userBid(
      configuration.networks[networkToUse].privateKeys[0],
      contractName,
      BigInt(parseInt(amountBet))
    );
    break;
  case "claim":
    userClaim(
      configuration.networks[networkToUse].privateKeys[0],
      contractName
    );
    break;
    case "boost":
      boostRound(
        configuration.networks[networkToUse].privateKeys[0],
        contractName,
        BigInt(amountBet),
        BigInt(epoch),
      );
  default:
    break;
}
