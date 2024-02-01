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
  Predict,
  PredictInstance,
  PredictTypes,
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
import {
  Address,
  Round,
  RoundParticipation,
  connect,
  createAndGetNewAddress,
  createAndGetNewParticipation,
  createAndGetNewRound,
  initDb,
} from "./database/db";
import { Sequelize, where } from "sequelize";
import { exit } from "process";

const POLLING_INTERVAL_EVENTS = 6 * 1000;

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
const optionsBear: EventSubscribeOptions<PredictTypes.BetBearEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictTypes.BetBearEvent
  ): Promise<void> => {
    //if(BigInt(actualEpoch) == event.fields.epoch){
    console.log(
      `Bear(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch}, anyone can claim ${event.fields.claimedByAnyoneTimestamp})`
    );


    const userAddressEvent = event.fields.from;
    const epoch = event.fields.epoch;
    const claimedByAnyone = event.fields.claimedByAnyoneTimestamp

    const [addrId, ] = await createAndGetNewAddress(userAddressEvent);
    const [roundId, ] = await createAndGetNewRound(epoch, 0, false);

    const [roundParticipation, created] = await createAndGetNewParticipation(
      roundId,
      addrId,
      event.fields.up,
      event.fields.amount,
      false,
      claimedByAnyone
    );

    if (!created)
      await roundParticipation.update({
        upBid: event.fields.up,
        amountBid: event.fields.amount,
        claimedByAnyoneTimestamp: claimedByAnyone

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

const optionsBull: EventSubscribeOptions<PredictTypes.BetBullEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictTypes.BetBullEvent
  ): Promise<void> => {
    //  if(BigInt(actualEpoch) == event.fields.epoch){

    console.log(
      `Bull(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch}, anyone can claim ${event.fields.claimedByAnyoneTimestamp})`
    );

    const userAddressEvent = event.fields.from;
    const epoch = event.fields.epoch;
    const claimedByAnyone = event.fields.claimedByAnyoneTimestamp

    const [addrId, ] = await createAndGetNewAddress(userAddressEvent);
    const [roundId, ] = await createAndGetNewRound(epoch, 0, false);
      
    const [roundParticipation, created] = await createAndGetNewParticipation(
      roundId,
      addrId,
      event.fields.up,
      event.fields.amount,
      false,
      claimedByAnyone
    );

    if (!created)
      await roundParticipation.update({
        upBid: event.fields.up,
        amountBid: event.fields.amount,
        claimedByAnyoneTimestamp: claimedByAnyone
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

const optionsClaimed: EventSubscribeOptions<PredictTypes.ClaimedEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: async (
    event: PredictTypes.ClaimedEvent
  ): Promise<void> => {
    console.log(
      `Claimed(from: ${event.fields.from}, for: ${
        event.fields.punterAddress
      }, ${event.fields.amount / ONE_ALPH}, ${event.fields.epoch})`
    );

    const userAddressEvent = event.fields.punterAddress;
    const epoch = event.fields.epoch;

    const [addrId, ] = await createAndGetNewAddress(userAddressEvent);
    const [roundId, ] = await createAndGetNewRound(epoch, 0, false);

    const [roundParticipation, created] = await createAndGetNewParticipation(
      roundId,
      addrId,
      false,
      0n,
      true,
      0n
    );

    if (!created) await roundParticipation.update({ claimed: true });

    return Promise.resolve();
  },
  // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
  errorCallback: (error, subscription): Promise<void> => {
    console.error(error);
    subscription.unsubscribe();
    return Promise.resolve();
  },
};

const optionsRoundEnd: EventSubscribeOptions<PredictTypes.RoundEndedEvent> =
  {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: POLLING_INTERVAL_EVENTS,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: async (
      event: PredictTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(`Round Ended(${event.fields.epoch}, ${event.fields.price})`);

      const [round, created] = await Round.findCreateFind({
        where: { epoch: event.fields.epoch },
        defaults: { priceEnd: event.fields.price },
      });
      if (!created) await round.update({ priceEnd: event.fields.price });
      
      return Promise.resolve();
    },
    // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
    errorCallback: (error, subscription): Promise<void> => {
      console.error(error);
      subscription.unsubscribe();
      return Promise.resolve();
    },
  };

const optionsRoundStart: EventSubscribeOptions<PredictTypes.RoundStartedEvent> =
  {
    // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
    pollingInterval: POLLING_INTERVAL_EVENTS,
    // The `messageCallback` will be called every time we recive a new event
    messageCallback: async (
      event: PredictTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(
        `Round Started(${event.fields.epoch}, ${event.fields.price})`
      );

      const [round, created] = await Round.findCreateFind({
        where: { epoch: event.fields.epoch },
        defaults: { priceStart: event.fields.price },
      });
      if (!created) await round.update({ priceStart: event.fields.price });

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
  const predictalphDeployed = await Predict.at(predictalphContractAddress);

  const contractIdKeyExists = await keyExists("contractid");
  if (contractIdKeyExists) {
    const contractId = await redis.get("contractid");

    if (contractId != predictalphContractId) {
      console.log("Contract changed, flush db");
      await redis.flushdb();
      initDb(sequelize, true)
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
  
  console.log(`Events from contract ${contractEventsCounter}, number of events seen ${eventCounterSaved}`);

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
const sequelize = connect(process.env.DB_PATH === undefined ? "/data/roundsData.sqlite" :  process.env.DB_PATH);

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

console.log("dine")