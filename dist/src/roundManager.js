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
const ioredis_1 = require("ioredis");
async function getAllEpochAddress(address) {
    if (!keyExists(address) || !keyExists("claim" + address)) {
        return 0;
    }
    redis.sdiff(address, "claim" + address, async (err, result) => {
        if (err) {
            console.error(err);
        }
        else {
            console.log(result);
            //await redis.del(address)
            return result;
        }
    });
}
function setNewEpochUser(address, epoch) {
    redis.sadd(address, Number(epoch));
}
function setEpochClaimed(address, epoch) {
    redis.sadd("claim" + address, Number(epoch));
}
async function keyExists(key) {
    const reply = await redis.exists(key);
    try {
        if (reply === 1) {
            return true;
        }
        else {
            return false;
        }
    }
    catch (error) {
        console.error(error);
        return false;
    }
}
async function setKeyValue(key, value) {
    await redis.set(key, value);
}
// `TokenFaucetTypes.WithdrawEvent` is a generated TypeScript type
const optionsBear = {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: 4000,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: (event) => {
        //if(BigInt(actualEpoch) == event.fields.epoch){
        console.log(`Bear(${event.fields.from}, ${event.fields.amount / web3_1.ONE_ALPH}, ${event.fields.up}, ${event.fields.epoch})`);
        setNewEpochUser(event.fields.from, event.fields.epoch);
        //}
        return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription) => {
        console.error(error);
        subscription.unsubscribe();
        return Promise.resolve();
    }
};
const optionsBull = {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: 4000,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: (event) => {
        //  if(BigInt(actualEpoch) == event.fields.epoch){
        console.log(`Bull(${event.fields.from}, ${event.fields.amount / web3_1.ONE_ALPH}, ${event.fields.up}, ${event.fields.epoch})`);
        setNewEpochUser(event.fields.from, event.fields.epoch);
        //}
        return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription) => {
        console.error(error);
        subscription.unsubscribe();
        return Promise.resolve();
    }
};
const optionsRoundEnd = {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: 4000,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: (event) => {
        console.log(`Round Ended(${event.fields.epoch}, ${event.fields.price})`);
        return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription) => {
        console.error(error);
        subscription.unsubscribe();
        return Promise.resolve();
    }
};
const optionsRoundStart = {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: 4000,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: (event) => {
        console.log(`Round Started(${event.fields.epoch}, ${event.fields.price})`);
        //setKeyValue("epoch",Number(event.fields.epoch))
        return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription) => {
        console.error(error);
        subscription.unsubscribe();
        return Promise.resolve();
    }
};
const optionsClaimed = {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: 4000,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: (event) => {
        console.log(`Claimed(${event.fields.from}, ${event.fields.amount / web3_1.ONE_ALPH}, ${event.fields.epoch})`);
        //setKeyValue("epoch",Number(event.fields.epoch))
        setEpochClaimed(event.fields.from, event.fields.epoch);
        return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription) => {
        console.error(error);
        subscription.unsubscribe();
        return Promise.resolve();
    }
};
async function getPunterBid(privKey, group, contractName) {
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
    const predictalphInstance = deployed.contractInstance;
    const predictalphContractId = deployed.contractInstance.contractId;
    const predictalphContractAddress = deployed.contractInstance.address;
    const predictalphDeployed = await ts_1.Predictalph.at(predictalphContractAddress);
    const contractIdKeyExists = await keyExists("contractid");
    if (contractIdKeyExists) {
        const contractId = await redis.get("contractid");
        if (contractId != predictalphContractId) {
            console.log("Contract changed, flush db");
            await redis.flushdb();
        }
    }
    setKeyValue("contractid", predictalphContractId);
    const subscriptionBear = predictalphDeployed.subscribeBetBearEvent(optionsBear, 0);
    const subscriptionBull = predictalphDeployed.subscribeBetBullEvent(optionsBull, 0);
    const subscriptionRoundEnd = predictalphDeployed.subscribeRoundEndedEvent(optionsRoundEnd, 0);
    const subscriptionRoundStart = predictalphDeployed.subscribeRoundStartedEvent(optionsRoundStart, 0);
    const subscriptionClaimed = predictalphDeployed.subscribeClaimedEvent(optionsClaimed, 0);
}
const retryFetch = fetchRetry.default(fetch, {
    retries: 10,
    retryDelay: 1000,
});
let networkToUse = process.argv.slice(2)[0];
if (networkToUse === undefined)
    networkToUse = "mainnet";
//Select our network defined in alephium.config.ts
//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new web3_1.NodeProvider(alephium_config_1.default.networks[networkToUse].nodeUrl, undefined, retryFetch);
//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3_1.web3.setCurrentNodeProvider(nodeProvider);
const redis = new ioredis_1.Redis();
const group = 0;
getPunterBid(alephium_config_1.default.networks[networkToUse].privateKeys[group], group, "Predictalph");
