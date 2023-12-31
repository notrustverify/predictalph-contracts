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
  ZERO_ADDRESS,
} from "@alephium/web3";
import { PrivateKeyWallet } from "@alephium/web3-wallet";
import configuration from "../alephium.config";
import TelegramBot from "node-telegram-bot-api";
import { TwitterApi } from "twitter-api-v2";


const tenMinutes = 10 * 60 * 1000;
const threeHours = 3 * 3600 * 1000;

export function sendMessage(bot: TelegramBot, chatId: string, message: string) {
console.log(`Send message ${message}`)
bot.sendMessage(chatId, message, { parse_mode: "HTML", disable_web_page_preview: true});
}

export async function sendTweet(client: TwitterApi, message: string){
  try {
    await client.v2.tweet(message);
    //console.log("success");
  } catch (error) {
    console.error(error);
  }
}


const formatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const DIVISIONS = [
  { amount: 60, name: "seconds" },
  { amount: 60, name: "minutes" },
  { amount: 24, name: "hours" },
  { amount: 7, name: "days" },
  { amount: 4.34524, name: "weeks" },
  { amount: 12, name: "months" },
  { amount: Number.POSITIVE_INFINITY, name: "years" },
];

export function formatTimeAgo(duration: number) {
  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i];
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.name as any);
    }
    duration /= division.amount;
  }
}

export function randomChar(){
  return Math.random().toString(36).slice(2, 6);
}