"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_1 = require("../artifacts/ts");
const web3_1 = require("@alephium/web3");
const deployTemplate = async (deployer) => {
    await deployer.deployContract(ts_1.Punter, {
        initialFields: {
            prediction: '00',
            punterAddress: web3_1.ZERO_ADDRESS,
            epoch: 0n,
            upBid: false,
            amountBid: 0n
        }
    });
    await deployer.deployContract(ts_1.Round, {
        initialFields: {
            prediction: '00',
            epoch: 0n,
            priceStart: 0n,
            feesBasisPts: 0n,
            bidEndTimestamp: 0n,
            operator: web3_1.ZERO_ADDRESS,
            rewardsComputed: false,
            priceEnd: 0n,
            totalAmount: 0n,
            amountUp: 0n,
            amountDown: 0n,
            treasuryAmount: 0n,
            rewardAmount: 0n,
            rewardBaseCalAmount: 0n
        }
    });
};
exports.default = deployTemplate;
