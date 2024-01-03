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
import { CoinGeckoClient } from "coingecko-api-v3";
import TelegramBot from "node-telegram-bot-api";
import { sendMessage, sendTweet } from "./utlis-bot";
import { TwitterApi, TwitterApiV2Settings, TwitterApiReadWrite } from "twitter-api-v2";

const POLLING_INTERVAL_EVENTS = 6 * 1000;

const token = process.env.TG_TOKEN ?? "";

  const twitterClient = new TwitterApi(   {
  appKey: process.env.API_KEY,
  appSecret: process.env.API_KEY_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,

})



const chatId = "@alephiumbet";
const bot = new TelegramBot(token, { polling: false });

let bullCounter = 0;
let bearCounter = 0;

let currentEpoch = BigInt(0);

let predictalphContractId;
let predictalphContractAddress;
let group = 0;


const ALPH="ℵ"
const MAX_MESSAGE_BET=6

// `TokenFaucetTypes.WithdrawEvent` is a generated TypeScript type
const optionsBear: EventSubscribeOptions<PredictalphTypes.BetBearEvent> = {
  // We specify the pollingInterval as 4 seconds, which will query the contract for new events every 4 seconds
  pollingInterval: POLLING_INTERVAL_EVENTS,
  // The `messageCallback` will be called every time we recive a new event
  messageCallback: (event: PredictalphTypes.BetBearEvent): Promise<void> => {
    //if(BigInt(actualEpoch) == event.fields.epoch){
    console.log(
      `Bear(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch})`
    );
    if (bearCounter <= MAX_MESSAGE_BET && event.fields.epoch == currentEpoch) {
     sendMessage(
        bot,
        chatId,
        `\n\n🐻 Round ${event.fields.epoch} - <b>New Bear</b> in the room.\n🎫 Bet ${event.fields.amount-ONE_ALPH / ONE_ALPH}${ALPH}\n\nWant to bet against ? <a href="https://alph.bet">Play here</a>`
      );
      sendTweet(twitterClient, `🐻 Round ${event.fields.epoch} -New Bear in the room.\n🎫 Bet ${(Number(event.fields.amount-ONE_ALPH) / Number(ONE_ALPH)).toFixed(3)}${ALPH}\n\nWant to bet against ? Play here 👇 https://alph.bet` )
      bearCounter++;
    }

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
  messageCallback: (event: PredictalphTypes.BetBullEvent): Promise<void> => {
    //  if(BigInt(actualEpoch) == event.fields.epoch){
    console.log(
      `Bull(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.up
      }, ${event.fields.epoch})`
    );
    if (bullCounter <= MAX_MESSAGE_BET && event.fields.epoch == currentEpoch) {
      sendMessage(
        bot,
        chatId,
        `\n\n🐂 Round ${event.fields.epoch} - <b>New Bull</b> in the room.\n🎫 Bet ${event.fields.amount-ONE_ALPH / ONE_ALPH}${ALPH}\n\nWant to bet against ? <a href="https://alph.bet">Play here</a>`
      );

        sendTweet(twitterClient,`🐂 Round ${event.fields.epoch} - New Bull in the room.\n🎫 Bet ${(Number(event.fields.amount-ONE_ALPH) / Number(ONE_ALPH)).toFixed(3)}${ALPH}\n\nWant to bet against ? Play here 👇 https://alph.bet`)

      bullCounter++;
    }

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
    messageCallback: (
      event: PredictalphTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(`Round Ended(${event.fields.epoch}, ${event.fields.price})`);

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
    pollingInterval: POLLING_INTERVAL_EVENTS,
    messageCallback: async (
      event: PredictalphTypes.RoundEndedEvent
    ): Promise<void> => {
      console.log(
        `Round Started(${event.fields.epoch}, ${event.fields.price})`
      );
      bullCounter = 0;
      bearCounter = 0;

      let getLastRoundState;
      if (event.fields.epoch == currentEpoch) {
        getLastRoundState = await getRoundContractState(
          predictalphContractId,
          event.fields.epoch - 1n,
          group
        );
      }

      let message = "";

      if (getLastRoundState !== undefined) {
        const priceEnd = getLastRoundState.fields.priceEnd;
        const priceStart = getLastRoundState.fields.priceStart;
        const totalAmount = getLastRoundState.fields.totalAmount / ONE_ALPH;
        const bullWon = priceEnd > priceStart;
        const houseWon = priceEnd == priceStart;
        message += `Last round ended: <b>${
          houseWon ? "House Won" : bullWon ? "Bull won" : "Bear won"
        }</b>. Total Amount played: ${totalAmount}ℵ\n\n`;
      }

      message += `🏛️ Round ${
        event.fields.epoch
      } just started. Locked price is <b>$${
        Number(event.fields.price) / 10000
      }</b>.\nWho is the bear, who is the bull?\n\n🧮 Try your guess at <a href="https://alph.bet">ALPH.bet</a>`;

      if (event.fields.epoch == currentEpoch){
       // sendMessage(bot, chatId,message);
      }else if (event.fields.epoch > currentEpoch){
        //sendMessage(bot, chatId,message);
        currentEpoch = event.fields.epoch
      }

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
  messageCallback: (event: PredictalphTypes.ClaimedEvent): Promise<void> => {
    console.log(
      `Claimed(${event.fields.from}, ${event.fields.amount / ONE_ALPH}, ${
        event.fields.epoch
      })`
    );

    //setKeyValue("epoch",Number(event.fields.epoch))
    return Promise.resolve();
  },
  // The `errorCallback` will be called when an error occurs, here we unsubscribe the subscription and log the error
  errorCallback: (error, subscription): Promise<void> => {
    console.error(error);
    subscription.unsubscribe();
    return Promise.resolve();
  },
};

async function getPunterBid(privKey: string, contractName: string) {
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
  group = wallet.group;
  const deployed = deployments.getDeployedContractResult(group, contractName);

  const predictalphInstance = deployed.contractInstance;
  predictalphContractId = deployed.contractInstance.contractId;
  predictalphContractAddress = deployed.contractInstance.address;
  const predictalphDeployed = await Predictalph.at(predictalphContractAddress);

  const predictionStates = await predictalphDeployed.fetchState();

  currentEpoch = predictionStates.fields.epoch;

  const subscriptionBear = predictalphDeployed.subscribeBetBearEvent(
    optionsBear,
    0
  );
  const subscriptionBull = predictalphDeployed.subscribeBetBullEvent(
    optionsBull,
    0
  );
  const subscriptionRoundEnd = predictalphDeployed.subscribeRoundEndedEvent(
    optionsRoundEnd,
    0
  );
  const subscriptionRoundStart = predictalphDeployed.subscribeRoundStartedEvent(
    optionsRoundStart,
    0
  );
  const subscriptionClaimed = predictalphDeployed.subscribeClaimedEvent(
    optionsClaimed,
    0
  );

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

getPunterBid(
  configuration.networks[networkToUse].privateKeys[0],
  "Predictalph"
);
