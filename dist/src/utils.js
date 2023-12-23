"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrice = exports.getRoundContractId = exports.getRoundContractState = exports.arrayEpochToBytes = exports.contractExists = exports.transferAlphTo = exports.destroyRound = exports.withdraw = exports.bid = exports.endRound = exports.startRound = exports.deployDynamicArray = exports.deployRoundTemplate = exports.deployPunterTemplate = exports.deployPrediction = exports.defaultSigner = exports.ZERO_ADDRESS = void 0;
const web3_1 = require("@alephium/web3");
const ts_1 = require("../artifacts/ts");
const web3_wallet_1 = require("@alephium/web3-wallet");
const web3_test_1 = require("@alephium/web3-test");
const cli_1 = require("@alephium/cli");
web3_1.web3.setCurrentNodeProvider("http://127.0.0.1:22973", undefined, fetch);
exports.ZERO_ADDRESS = "tgx7VNFoP9DJiFMFgXXtafQZkUvyEdDHT9ryamHJYrjq";
exports.defaultSigner = new web3_wallet_1.PrivateKeyWallet({
    privateKey: web3_test_1.testPrivateKey,
});
async function deployPrediction(operator, repeatEverySecond, epoch) {
    const punterTemplateId = await deployPunterTemplate();
    const roundTemplateId = await deployRoundTemplate();
    const dynamicArrayContract = await deployDynamicArray();
    return await ts_1.Predictalph.deploy(exports.defaultSigner, {
        initialFields: {
            punterTemplateId: punterTemplateId.contractInstance.contractId,
            roundTemplateId: roundTemplateId.contractInstance.contractId,
            dynamicArrayForIntId: dynamicArrayContract.contractInstance.contractId,
            epoch: epoch,
            operator: operator,
            feesBasisPts: 100n,
            repeatEvery: BigInt(repeatEverySecond * 1000),
        },
    });
}
exports.deployPrediction = deployPrediction;
async function deployPunterTemplate() {
    return await ts_1.Punter.deploy(exports.defaultSigner, {
        initialFields: {
            prediction: "00",
            punterAddress: exports.ZERO_ADDRESS,
            epoch: 0n,
            upBid: false,
            amountBid: 0n,
        },
    });
}
exports.deployPunterTemplate = deployPunterTemplate;
async function deployRoundTemplate() {
    return await ts_1.Round.deploy(exports.defaultSigner, {
        initialFields: {
            prediction: "00",
            epoch: 0n,
            priceStart: 0n,
            feesBasisPts: 0n,
            bidEndTimestamp: 0n,
            operator: exports.ZERO_ADDRESS,
            rewardsComputed: false,
            priceEnd: 0n,
            totalAmount: 0n,
            amountUp: 0n,
            amountDown: 0n,
            treasuryAmount: 0n,
            rewardAmount: 0n,
            rewardBaseCalAmount: 0n,
        },
    });
}
exports.deployRoundTemplate = deployRoundTemplate;
async function deployDynamicArray() {
    return await ts_1.DynamicArrayForInt.deploy(exports.defaultSigner, { initialFields: {} });
}
exports.deployDynamicArray = deployDynamicArray;
async function startRound(signer, predictalph, price) {
    return await ts_1.Start.execute(signer, {
        initialFields: { predictalph: predictalph.contractId, price: price },
        attoAlphAmount: web3_1.ONE_ALPH,
    });
}
exports.startRound = startRound;
async function endRound(signer, predictalph, price) {
    return await ts_1.End.execute(signer, {
        initialFields: { predictalph: predictalph.contractId, price: price },
        attoAlphAmount: web3_1.ONE_ALPH,
    });
}
exports.endRound = endRound;
async function bid(signer, predictalph, amount, up) {
    return await ts_1.Bid.execute(signer, {
        initialFields: {
            predictalph: predictalph.contractId,
            amount: amount,
            up: up,
        },
        attoAlphAmount: amount + 2n * web3_1.DUST_AMOUNT,
    });
}
exports.bid = bid;
async function withdraw(signer, predictalph, epochParticipation) {
    return await ts_1.Withdraw.execute(signer, {
        initialFields: { predictalph: predictalph.contractId, epochParticipation },
        attoAlphAmount: web3_1.DUST_AMOUNT,
    });
}
exports.withdraw = withdraw;
async function destroyRound(signer, predictalph, epochArray) {
    return await ts_1.DestroyRound.execute(signer, {
        initialFields: { predictalph: predictalph.contractId, arrayEpoch: epochArray },
        attoAlphAmount: web3_1.DUST_AMOUNT,
    });
}
exports.destroyRound = destroyRound;
async function waitTxConfirmed(promise) {
    const result = await promise;
    await (0, cli_1.waitTxConfirmed)(web3_1.web3.getCurrentNodeProvider(), result.txId, 1, 1000);
    return result;
}
async function transferAlphTo(to, amount) {
    return await waitTxConfirmed(exports.defaultSigner.signAndSubmitTransferTx({
        signerAddress: web3_test_1.testAddress,
        destinations: [{ address: to, attoAlphAmount: amount }],
    }));
}
exports.transferAlphTo = transferAlphTo;
async function contractExists(address) {
    try {
        const nodeProvider = web3_1.web3.getCurrentNodeProvider();
        await nodeProvider.contracts.getContractsAddressState(address, {
            group: (0, web3_1.groupOfAddress)(address),
        });
        return true;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("KeyNotFound")) {
            return false;
        }
        throw error;
    }
}
exports.contractExists = contractExists;
function arrayEpochToBytes(arrayEpoch) {
    const buffer = Buffer.alloc(arrayEpoch.length * 4);
    arrayEpoch.forEach((value, index) => buffer.writeUInt32BE(value, index * 4));
    return buffer.toString('hex');
}
exports.arrayEpochToBytes = arrayEpochToBytes;
async function getRoundContractState(predictAlphContractId, epoch, groupIndex) {
    const roundContractId = getRoundContractId(predictAlphContractId, epoch, groupIndex);
    const roundContract = ts_1.Round.at((0, web3_1.addressFromContractId)(roundContractId));
    const state = await roundContract.fetchState();
    return state;
}
exports.getRoundContractState = getRoundContractState;
function getRoundContractId(predictAlphContractId, epoch, groupIndex) {
    return (0, web3_1.subContractId)(predictAlphContractId, getEpochPath(epoch), groupIndex);
}
exports.getRoundContractId = getRoundContractId;
function getEpochPath(epoch) {
    return "00" + epoch.toString(16).padStart(8, "0");
}
async function getPrice(cgClient) {
    const alphCoinGecko = await cgClient.simplePrice({ vs_currencies: "usd", ids: "alephium" });
    if (alphCoinGecko.alephium.usd <= 0) {
        throw new Error("Price is not correct");
    }
    return Math.round((alphCoinGecko.alephium.usd + Number.EPSILON) * 1000) / 1000;
}
exports.getPrice = getPrice;
