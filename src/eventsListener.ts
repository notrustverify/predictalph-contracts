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
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import configuration from "../alephium.config";
import {
  End,
  Predictalph,
  PredictalphInstance,
  PredictalphTypes,
  Start,
} from "../artifacts/ts";
import * as fetchRetry from "fetch-retry";
import {
  contractExists,
  getRoundContractId,
  getRoundContractState,
} from "./utils";
import { Redis } from "ioredis";
import { CoinGeckoClient } from "coingecko-api-v3";
import { Address, Round, RoundParticipation, connect } from "./database/db";
import { Sequelize } from "sequelize";

const POLLING_INTERVAL_EVENTS = 6 * 1000;

async function getAllEpochAddress(address: string) {
  if (!keyExists(address) || !keyExists("claim" + address)) {
    return 0;
  }
  redis.sdiff(address, "claim" + address, async (err, result) => {
    if (err) {
      console.error(err);
    } else {
      console.log(result);
      //await redis.del(address)
      return result;
    }
  });
}

function setNewEpochUser(address: string, epoch: bigint) {
  redis.sadd(address, Number(epoch));
}

function setEpochClaimed(address: string, epoch: bigint) {
  redis.sadd("claim" + address, Number(epoch));
}

async function keyExists(key: string) {
  const reply = await redis.exists(key);
  try {
    if (reply === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function setKeyValue(key: string, value: string) {
  await redis.set(key, value);
}

// `TokenFaucetTypes.WithdrawEvent` is a generated TypeScript type
const optionsBear: EventSubscribeOptions<PredictalphTypes.BetBearEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictalphTypes.BetBearEvent
  ): Promise<void> => {
    //if(BigInt(actualEpoch) == event.fields.epoch){
    console.log(
      `Bear(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch})`
    );
    const userAddress = event.fields.from;
    const epoch = event.fields.epoch;
    setNewEpochUser(event.fields.from, event.fields.epoch);
    Address.create({ address: userAddress })
      .then(() => {
        console.log("created");
      })
      .catch((error) => {
        console.error("already exists");
      });

    const addrId = await Address.findOne({ where: { address: userAddress } });
    const roundId = await Round.findOne({ where: { epoch: epoch } });

    RoundParticipation.create({
      RoundId: roundId.id,
      AddressId: addrId.id,
      upBid: event.fields.up,
      amountBid: event.fields.amount,
      claimed: false,
    })
      .then(() => {
        console.log("round participation created");
      })
      .catch((error) => {
        console.error("already exists");
      });

    //}
    return Promise.resolve();
  },
  // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
  errorCallback: (error, subscription): Promise<void> => {
    console.error(error);
    subscription.unsubscribe();
    return Promise.resolve();
  },
};

const optionsBull: EventSubscribeOptions<PredictalphTypes.BetBullEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictalphTypes.BetBullEvent
  ): Promise<void> => {
    //  if(BigInt(actualEpoch) == event.fields.epoch){

    console.log(
      `Bull(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch})`
    );
    setNewEpochUser(event.fields.from, event.fields.epoch);
    const userAddress = event.fields.from;
    const epoch = event.fields.epoch;
    setNewEpochUser(event.fields.from, event.fields.epoch);
    Address.create({ address: userAddress })
      .then(() => {
        console.log("created");
      })
      .catch((error) => {
        console.error("already exists");
      });

    const addrId = await Address.findOne({ where: { address: userAddress } });
    const roundId = await Round.findOne({ where: { epoch: epoch } });

    RoundParticipation.create({
      RoundId: roundId.id,
      AddressId: addrId.id,
      upBid: event.fields.up,
      amountBid: event.fields.amount,
      claimed: false,
    })
      .then(() => {
        console.log("round participation created");
      })
      .catch((error) => {
        console.error("already exists");
      });

    //}
    return Promise.resolve();
  },
  // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
  errorCallback: (error, subscription): Promise<void> => {
    console.error(error);
    subscription.unsubscribe();
    return Promise.resolve();
  },
};

const optionsRoundEnd: EventSubscribeOptions<PredictalphTypes.RoundEndedEvent> =
  {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: POLLING_INTERVAL_EVENTS,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: async (
      event: PredictalphTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(`Round Ended(${event.fields.epoch}, ${event.fields.price})`);

      Round.create({
        epoch: event.fields.epoch,
        priceEnd: event.fields.price,
      })
        .then(() => {

          
        })
        .catch((error) => {
          console.error("already exists");
          Round.update(
            { priceEnd: event.fields.price },
            { where: { epoch: event.fields.epoch } }
          );

        });

      return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription): Promise<void> => {
      console.error(error);
      subscription.unsubscribe();
      return Promise.resolve();
    },
  };

const optionsRoundStart: EventSubscribeOptions<PredictalphTypes.RoundStartedEvent> =
  {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: POLLING_INTERVAL_EVENTS,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: async (
      event: PredictalphTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(
        `Round Started(${event.fields.epoch}, ${event.fields.price})`
      );
      //setKeyValue("epoch",Number(event.fields.epoch))
      Round.create({
        epoch: event.fields.epoch,
        priceStart: event.fields.price,
      })
        .then(() => {
        })
        .catch((error) => {
          console.error("already exists");
          Round.update(
            { priceStart: event.fields.price },
            { where: { epoch: event.fields.epoch } }
          );

        });

      return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription): Promise<void> => {
      console.error(error);
      subscription.unsubscribe();
      return Promise.resolve();
    },
  };

const optionsClaimed: EventSubscribeOptions<PredictalphTypes.ClaimedEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictalphTypes.ClaimedEvent
  ): Promise<void> => {
    console.log(
      `Claimed(from: ${event.fields.from}, for: ${event.fields.punterAddress}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.epoch
      })`
    );

    const userAddress = event.fields.punterAddress;
    const epoch = event.fields.epoch;
    const addrId = await Address.findOne({ where: { address: userAddress } });
    const roundId = await Round.findOne({ where: { epoch: epoch } });

    RoundParticipation.update(
      { claimed: true },
      { where: { AddressId: addrId.id, RoundId: roundId.id } }
    );
    //setKeyValue("epoch",Number(event.fields.epoch))
    setEpochClaimed(event.fields.punterAddress, event.fields.epoch);
    return Promise.resolve();
  },
  // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
  errorCallback: (error, subscription): Promise<void> => {
    console.error(error);
    subscription.unsubscribe();
    return Promise.resolve();
  },
};

async function getPunterBid(
  privKey: string,
  contractName: string,
  sequelize: Sequelize
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

  const predictalphInstance = deployed.contractInstance;
  const predictalphContractId = deployed.contractInstance.contractId;
  const predictalphContractAddress = deployed.contractInstance.address;
  const predictalphDeployed = await Predictalph.at(predictalphContractAddress);

  const contractIdKeyExists = await keyExists("contractid");
  if (contractIdKeyExists) {
    const contractId = await redis.get("contractid");

    if (contractId != predictalphContractId) {
      console.log("Contract changed, flush db");
      await redis.flushdb();
    }
  }

  const contractEventsCounter =
    await predictalphDeployed.getContractEventsCurrentCount();
  let eventCounterSaved = Number(await redis.get(KEY_NAME_COUNTER_EVENT));

  setKeyValue("contractid", predictalphContractId);
  const subscriptionRoundStart = predictalphDeployed.subscribeRoundStartedEvent(
    optionsRoundStart,
    eventCounterSaved
  );
  const subscriptionBear = predictalphDeployed.subscribeBetBearEvent(
    optionsBear,
    eventCounterSaved
  );
  const subscriptionBull = predictalphDeployed.subscribeBetBullEvent(
    optionsBull,
    eventCounterSaved
  );
  const subscriptionRoundEnd = predictalphDeployed.subscribeRoundEndedEvent(
    optionsRoundEnd,
    eventCounterSaved
  );

  const subscriptionClaimed = predictalphDeployed.subscribeClaimedEvent(
    optionsClaimed,
    eventCounterSaved
  );
  console.log(contractEventsCounter, eventCounterSaved);

  setKeyValue(KEY_NAME_COUNTER_EVENT, contractEventsCounter.toString());

  if (
    subscriptionBear.isCancelled() ||
    subscriptionBull.isCancelled() ||
    subscriptionRoundEnd.isCancelled() ||
    subscriptionRoundStart.isCancelled() ||
    subscriptionClaimed.isCancelled()
  ) {
    throw new Error("One event has been cancelled, exit");
  }
}

const retryFetch = fetchRetry.default(fetch, {
  retries: 10,
  retryDelay: 1000,
});

const KEY_NAME_COUNTER_EVENT = "eventsCounter";

let networkToUse = process.argv.slice(2)[0];
if (networkToUse === undefined) networkToUse = "mainnet";
//Select our network defined in alephium.config.ts

//NodeProvider is an abstraction of a connection to the Alephium network
const nodeProvider = new NodeProvider(
  configuration.networks[networkToUse].nodeUrl,
  undefined,
  retryFetch
);

//Sometimes, it's convenient to setup a global NodeProvider for your project:
web3.setCurrentNodeProvider(nodeProvider);

const redis = new Redis({ host: process.env.REDIS_HOST });
const sequelize = connect("./data/roundsData.sqlite");

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database: ", error);
  });

getPunterBid(
  configuration.networks[networkToUse].privateKeys[0],
  "Predictalph",
  sequelize
);
