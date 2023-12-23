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
Object.defineProperty(exports, "__esModule", { value: true });
const web3_1 = require("@alephium/web3");
const web3_test_1 = require("@alephium/web3-test");
const ts_1 = require("../artifacts/ts");
const utils_1 = require("./utils");
const web3_wallet_1 = require("@alephium/web3-wallet");
const base58 = __importStar(require("bs58"));
describe("unit tests", () => {
    // Use the correct host and port
    web3_1.web3.setCurrentNodeProvider("http://127.0.0.1:22973");
    const groupIndex = (0, web3_1.groupOfAddress)(web3_test_1.testAddress);
    const bidDurationSecond = 30;
    jest.setTimeout(3 * 1000 * 60);
    let predictionGame;
    let round;
    let punter;
    let bidders;
    let operator;
    function getSubContractId(path) {
        return (0, web3_1.subContractId)(predictionGame.contractId, path, groupIndex);
    }
    function getEpochPath(epoch) {
        return "00" + epoch.toString(16).padStart(8, "0");
    }
    async function checkRoundState(epoch, amount) {
        const roundContractId = getSubContractId("00" + epoch.toString(16).padStart(8, "0"));
        const roundContract = ts_1.Round.at((0, web3_1.addressFromContractId)(roundContractId));
        const state = await roundContract.fetchState();
        expect(state.asset.alphAmount).toEqual(amount + web3_1.ONE_ALPH);
        expect(state.fields.epoch).toEqual(epoch);
    }
    async function getRoundState(epoch) {
        const roundContractId = getSubContractId("00" + epoch.toString(16).padStart(8, "0"));
        const roundContract = ts_1.Round.at((0, web3_1.addressFromContractId)(roundContractId));
        const state = await roundContract.fetchState();
        return state;
    }
    async function getRoundBidder(address, epoch) {
        const bidderContractId = getSubContractId("01" + base58.decode(address) + epoch.toString(16).padStart(8, "0"));
        const bidderContract = ts_1.Round.at((0, web3_1.addressFromContractId)(bidderContractId));
        const state = await bidderContract.fetchState();
        return state;
    }
    async function getArray(contractId) {
        const array = ts_1.DynamicArrayForInt.at((0, web3_1.addressFromContractId)(contractId));
        const arrayState = await array.fetchState();
        return arrayState;
    }
    beforeEach(async () => {
        operator = web3_wallet_1.PrivateKeyWallet.Random(groupIndex);
        predictionGame = (await (0, utils_1.deployPrediction)(operator.address, bidDurationSecond, 0n)).contractInstance;
        bidders = Array.from(Array(5).keys()).map((_) => web3_wallet_1.PrivateKeyWallet.Random(groupIndex));
        for (const bidder of bidders) {
            await (0, utils_1.transferAlphTo)(bidder.address, 100n * web3_1.ONE_ALPH);
        }
        await (0, utils_1.transferAlphTo)(operator.address, 100n * web3_1.ONE_ALPH);
    });
    test("create round, bid, withdraw", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        await (0, utils_1.bid)(bidder1, predictionGame, 9n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder2, predictionGame, 11n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, false);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        const predictionState = await predictionGame.fetchState();
        const roundState = await getRoundState(0n);
        const amountDown = roundState.fields.amountDown;
        const amountUp = roundState.fields.amountUp;
        const totalAmount = roundState.fields.totalAmount;
        const treasuryAmount = roundState.fields.treasuryAmount;
        const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
        const rewardAmount = roundState.fields.rewardAmount;
        const priceEnd = roundState.fields.priceEnd;
        //const bidder1State = getRoundBidder(bidder1.address, 0n);
        //console.log(bidder1State);
        expect(amountUp).toEqual(9n * web3_1.ONE_ALPH);
        expect(amountDown).toEqual(11n * web3_1.ONE_ALPH);
        expect(totalAmount).toEqual(20n * web3_1.ONE_ALPH);
        expect(treasuryAmount).toEqual(20n * 10n ** 16n);
        expect(roundState.asset.alphAmount).toEqual(21n * web3_1.ONE_ALPH);
        expect(predictionState.fields.epoch).toEqual(1n);
        expect(rewardBaseCalAmount).toEqual(amountUp);
        expect(rewardAmount).toEqual(20n * web3_1.ONE_ALPH - 20n * 10n ** 16n);
        expect(priceEnd).toEqual(11n);
        const arrayEpochBytes = (0, utils_1.arrayEpochToBytes)([0]);
        await (0, utils_1.withdraw)(bidder1, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder2, predictionGame, arrayEpochBytes);
        const roundStateWithdraw = await getRoundState(0n);
        const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;
        expect(totalAmountWithdraw).toEqual(treasuryAmount);
        expect(roundStateWithdraw.asset.alphAmount).toEqual(web3_1.ONE_ALPH + treasuryAmount);
        await (0, utils_1.destroyRound)(operator, predictionGame, (0, utils_1.arrayEpochToBytes)([0]));
        const exists = await (0, utils_1.contractExists)((0, web3_1.addressFromContractId)(getSubContractId("00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0"))));
        expect(exists).toEqual(false);
    });
    test("create round, end it, cannot destroy", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        //create contract
        await (0, utils_1.bid)(bidder2, predictionGame, 3n * web3_1.ONE_ALPH, false);
        await (0, web3_1.sleep)(30 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        const predictionState = await predictionGame.fetchState();
        expect(predictionState.fields.epoch).toEqual(1n);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.destroyRound)(operator, predictionGame, (0, utils_1.arrayEpochToBytes)([0])), (0, web3_1.addressFromContractId)(getSubContractId(getEpochPath(predictionState.fields.epoch - 1n))), 101);
    });
    test("create round, end it, cannot destroy still people to withdraw", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        //create contract
        await (0, utils_1.bid)(bidder2, predictionGame, 3n * web3_1.ONE_ALPH, false);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        await (0, utils_1.withdraw)(bidder2, predictionGame, "00");
        const predictionState = await predictionGame.fetchState();
        expect(predictionState.fields.epoch).toEqual(1n);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.destroyRound)(operator, predictionGame, (0, utils_1.arrayEpochToBytes)([0])), (0, web3_1.addressFromContractId)(getSubContractId(getEpochPath(predictionState.fields.epoch - 1n))), 101);
    });
    test("create round, end it too early", async () => {
        const bidder1 = bidders[0];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.endRound)(operator, predictionGame, 11n), predictionGame.address, 6);
    });
    test("2 rounds, 3 players", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        const bidder3 = bidders[2];
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder2, predictionGame, 2n * web3_1.ONE_ALPH, false);
        await (0, utils_1.bid)(bidder3, predictionGame, 2n * web3_1.ONE_ALPH, false);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        //ROUND TWO
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        const predictionState = await predictionGame.fetchState();
        expect(predictionState.fields.epoch).toEqual(1n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, false);
        await (0, utils_1.bid)(bidder2, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder3, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        const arrayEpochBytes = (0, utils_1.arrayEpochToBytes)([0, 1]);
        await (0, utils_1.withdraw)(bidder1, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder2, predictionGame, arrayEpochBytes);
    });
    test("bid 2 times", async () => {
        const bidder1 = bidders[0];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true), predictionGame.address, 8);
    });
    test("Start 2 rounds", async () => {
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.startRound)(operator, predictionGame, 10n), predictionGame.address, 5);
    });
    test("End before start", async () => {
        console.log("Game contract id", predictionGame.contractId);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.endRound)(operator, predictionGame, 10n), predictionGame.address, 7);
    });
    test("bid after timestamp over", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        const predictionState = await predictionGame.fetchState();
        const roundState = await getRoundState(0n);
        console.log(roundState.fields);
        //create contract
        await (0, utils_1.bid)(bidder1, predictionGame, 2n * web3_1.ONE_ALPH, true);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, web3_test_1.expectAssertionError)((0, utils_1.bid)(bidder2, predictionGame, 2n * web3_1.ONE_ALPH, true), predictionGame.address, 4);
        await (0, utils_1.endRound)(operator, predictionGame, 11n);
        //const predictionState = await predictionGame.fetchState();
        //expect(predictionState.fields.epoch).toEqual(1n);
    });
    test("create round, 5 bidders, withdraw", async () => {
        const bidder1 = bidders[0];
        const bidder2 = bidders[1];
        const bidder3 = bidders[2];
        const bidder4 = bidders[3];
        const bidder5 = bidders[4];
        console.log("Game contract id", predictionGame.contractId);
        await (0, utils_1.startRound)(operator, predictionGame, 10n);
        await (0, utils_1.bid)(bidder1, predictionGame, 9n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder2, predictionGame, 11n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder3, predictionGame, 11n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, true);
        await (0, utils_1.bid)(bidder4, predictionGame, 11n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, false);
        await (0, utils_1.bid)(bidder5, predictionGame, 11n * web3_1.ONE_ALPH + web3_1.ONE_ALPH, false);
        await (0, web3_1.sleep)(31 * 1000);
        await (0, utils_1.endRound)(operator, predictionGame, 9n);
        const predictionState = await predictionGame.fetchState();
        const roundState = await getRoundState(0n);
        const amountDown = roundState.fields.amountDown;
        const amountUp = roundState.fields.amountUp;
        const totalAmount = roundState.fields.totalAmount;
        const treasuryAmount = roundState.fields.treasuryAmount;
        const rewardBaseCalAmount = roundState.fields.rewardBaseCalAmount;
        const rewardAmount = roundState.fields.rewardAmount;
        const priceEnd = roundState.fields.priceEnd;
        //const bidder1State = getRoundBidder(bidder1.address, 0n);
        //console.log(bidder1State);
        expect(amountUp).toEqual(31n * web3_1.ONE_ALPH);
        expect(amountDown).toEqual(22n * web3_1.ONE_ALPH);
        expect(totalAmount).toEqual(53n * web3_1.ONE_ALPH);
        expect(treasuryAmount).toEqual(53n * 10n ** 16n);
        expect(roundState.asset.alphAmount).toEqual(53n * web3_1.ONE_ALPH + web3_1.ONE_ALPH);
        expect(predictionState.fields.epoch).toEqual(1n);
        expect(rewardBaseCalAmount).toEqual(amountDown);
        expect(rewardAmount).toEqual(53n * web3_1.ONE_ALPH - 53n * 10n ** 16n);
        expect(priceEnd).toEqual(9n);
        const arrayEpochBytes = (0, utils_1.arrayEpochToBytes)([0]);
        await (0, utils_1.withdraw)(bidder1, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder2, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder3, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder4, predictionGame, arrayEpochBytes);
        await (0, utils_1.withdraw)(bidder5, predictionGame, arrayEpochBytes);
        const roundStateWithdraw = await getRoundState(0n);
        const totalAmountWithdraw = roundStateWithdraw.fields.totalAmount;
        expect(totalAmountWithdraw).toEqual(treasuryAmount);
        expect(roundStateWithdraw.asset.alphAmount).toEqual(web3_1.ONE_ALPH + treasuryAmount);
        await (0, utils_1.destroyRound)(operator, predictionGame, (0, utils_1.arrayEpochToBytes)([0]));
        const exists = await (0, utils_1.contractExists)((0, web3_1.addressFromContractId)(getSubContractId("00" +
            (predictionState.fields.epoch - 1n).toString(16).padStart(8, "0"))));
        expect(exists).toEqual(false);
    });
});
