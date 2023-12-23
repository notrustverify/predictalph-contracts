"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cli_1 = require("@alephium/cli");
const web3_1 = require("@alephium/web3");
const web3_wallet_1 = require("@alephium/web3-wallet");
const alephium_config_1 = __importDefault(require("../alephium.config"));
const ts_1 = require("../artifacts/ts");
const fetchRetry = __importStar(require("fetch-retry"));
const utils_1 = require("./utils");
const coingecko_api_v3_1 = require("coingecko-api-v3");
async function startRound(privKey, group, contractName) {
    const wallet = new web3_wallet_1.PrivateKeyWallet({
        privateKey: privKey,
        keyType: undefined,
        nodeProvider: web3_1.web3.getCurrentNodeProvider(),
    });
    //.deployments contains the info of our `TokenFaucet` deployement, as we need to now the contractId and address
    //This was auto-generated with the `cli deploy` of our `scripts/0_deploy_faucet.ts`
    const deployments = await cli_1.Deployments.from("./artifacts/.deployments." + networkToUse + ".json");
    //Make sure it match your address group
    const accountGroup = group;
    const deployed = deployments.getDeployedContractResult(accountGroup, contractName);
    const predictalphContractId = deployed.contractInstance.contractId;
    const predictalphContractAddress = deployed.contractInstance.address;
    const predictionStates = await ts_1.Predictalph.at(predictalphContractAddress).fetchState();
    const roundContractId = (0, utils_1.getRoundContractId)(predictalphContractId, predictionStates.fields.epoch, wallet.group);
    const roundExist = await (0, utils_1.contractExists)((0, web3_1.addressFromContractId)(roundContractId));
    // dont continue, round already running
    if (roundExist)
        return;
    const price = await (0, utils_1.getPrice)(cgClient);
    try {
        const txStart = await ts_1.Start.execute(wallet, {
            initialFields: { predictalph: predictalphContractId, price: 10n },
            attoAlphAmount: web3_1.ONE_ALPH,
        });
        console.log(`Start round ${predictionStates.fields.epoch} ${txStart.txId}, price ${price}`);
        await (0, cli_1.waitTxConfirmed)(nodeProvider, txStart.txId, 1, 1000);
        console.log("Start round done");
    }
    catch (error) {
        console.error(error);
    }
}
async function endRound(privKey, group, contractName) {
    const wallet = new web3_wallet_1.PrivateKeyWallet({
        privateKey: privKey,
        keyType: undefined,
        nodeProvider: web3_1.web3.getCurrentNodeProvider(),
    });
    //.deployments contains the info of our `TokenFaucet` deployement, as we need to now the contractId and address
    //This was auto-generated with the `cli deploy` of our `scripts/0_deploy_faucet.ts`
    const deployments = await cli_1.Deployments.from("./artifacts/.deployments." + networkToUse + ".json");
    //Make sure it match your address group
    const accountGroup = group;
    const deployed = deployments.getDeployedContractResult(accountGroup, contractName);
    const predictalphContractId = deployed.contractInstance.contractId;
    const predictalphContractAddress = deployed.contractInstance.address;
    const moveRound = async () => {
        const predictionStates = await ts_1.Predictalph.at(predictalphContractAddress).fetchState();
        const roundContractId = (0, utils_1.getRoundContractId)(predictalphContractId, predictionStates.fields.epoch, wallet.group);
        const roundExists = await (0, utils_1.contractExists)((0, web3_1.addressFromContractId)(roundContractId));
        let roundState = null;
        let endTimestamp = 0;
        if (roundExists) {
            roundState = await (0, utils_1.getRoundContractState)(predictalphContractId, predictionStates.fields.epoch, wallet.group);
            endTimestamp = Number(roundState.fields.bidEndTimestamp);
            const price = await (0, utils_1.getPrice)(cgClient);
            try {
                if (Date.now() >= endTimestamp) {
                    const txStart = await ts_1.End.execute(wallet, {
                        initialFields: { predictalph: predictalphContractId, price: 11n },
                        attoAlphAmount: web3_1.ONE_ALPH,
                    });
                    console.log(`End round ${predictionStates.fields.epoch} ${txStart.txId} with price ${price}`);
                    await (0, cli_1.waitTxConfirmed)(nodeProvider, txStart.txId, 1, 1000);
                    console.log("End round done");
                    startRound(alephium_config_1.default.networks[networkToUse].privateKeys[group], group, "Predictalph");
                }
            }
            catch (error) {
                console.error(error);
            }
        }
        // setTimeout only accept 32bit value
        await (0, web3_1.sleep)(4000);
        let timeUntilEnd = endTimestamp - Date.now();
        if (timeUntilEnd > 2 ** 31)
            timeUntilEnd = 2 ** 31 - 1;
        console.log(`Will end in ${new Date(endTimestamp)}`);
        setTimeout(moveRound, timeUntilEnd);
    };
    moveRound();
}
const retryFetch = fetchRetry.default(fetch, {
    retries: 10,
    retryDelay: 1000,
});
const cgClient = new coingecko_api_v3_1.CoinGeckoClient({
    timeout: 10000,
    autoRetry: true,
});
let networkToUse = process.argv.slice(2)[0];
if (networkToUse === undefined)
    networkToUse = "mainnet";
//Select our network defined in alephium.config.ts
//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new web3_1.NodeProvider(alephium_config_1.default.networks[networkToUse].nodeUrl, undefined, retryFetch);
//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3_1.web3.setCurrentNodeProvider(nodeProvider);
const group = 0;
startRound(alephium_config_1.default.networks[networkToUse].privateKeys[group], group, "Predictalph");
endRound(alephium_config_1.default.networks[networkToUse].privateKeys[group], group, "Predictalph");
