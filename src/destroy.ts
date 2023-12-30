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
import { DestroyRound, End, Predictalph, Start } from "../artifacts/ts";
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
  const deployed = deployments.getDeployedContractResult(
    group,
    contractName
  );
  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;

  const predictionStates = await Predictalph.at(
    predictalphContractAddress
  ).fetchState();

const onlyRoundExists = []

for (const value of arrayRound){
    const roundContractId = getRoundContractId(
        predictalphContractId,
       BigInt(value),
        wallet.group
      );
    
      const roundExist = await contractExists(
        addressFromContractId(roundContractId)
      );
      if (roundExist && value !== Number(predictionStates?.fields.epoch)) onlyRoundExists.push(value)
}

  
console.log(onlyRoundExists.length)
if(onlyRoundExists.length > 0) {
  try {
    const tx = await DestroyRound.execute(wallet, {
      initialFields: {
        predictalph: predictalphContractId,
        arrayEpoch: arrayEpochToBytes(onlyRoundExists)
      },
      attoAlphAmount: ONE_ALPH,
    });

    console.log(
      `Destroy round ${onlyRoundExists} ${tx.txId}`
    );
    await waitTxConfirmed(nodeProvider, tx.txId, 1, 1000);
    console.log("Destroy rounds done");
  } catch (error) {
    console.error(error);
  }
}else{
    console.log("nothing to DESTROY")
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
if (networkToUse === undefined) networkToUse = "mainnet";
//Select our network defined in alephium.config.ts

const roundArrayToDestroyFrom = parseInt(process.argv.slice(2)[1])
const roundArrayToDestroyTo = parseInt(process.argv.slice(2)[2])

if (roundArrayToDestroyFrom == undefined) throw new Error("Missing array with round to destroy")

let arrayRound = []
arrayRound = Array.from({length: roundArrayToDestroyTo-roundArrayToDestroyFrom+1}, (_,index) => roundArrayToDestroyFrom+index )

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);

//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

destroyRound(
  configuration.networks[networkToUse].privateKeys[0],
  "Predictalph",
  arrayRound

);

