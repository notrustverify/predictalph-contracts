"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const configuration = {
    networks: {
        devnet: {
            //Make sure the two values match what's in your devnet configuration
            nodeUrl: 'http://127.0.0.1:22973',
            networkId: 4,
            privateKeys: ['a642942e67258589cd2b1822c631506632db5a12aabcf413604e785300d762a5'],
            settings: []
        },
        testnet: {
            //Make sure the two values match what's in your devnet configuration
            nodeUrl: 'https://wallet.testnet.alephium.org',
            networkId: 1,
            privateKeys: process.env.PRIVATE_KEYS === undefined ? [] : process.env.PRIVATE_KEYS.split(','),
            settings: []
        },
        mainnet: {
            //Make sure the two values match what's in your devnet configuration
            nodeUrl: 'http://localhost:22973',
            networkId: 0,
            privateKeys: [],
            settings: []
        }
    }
};
exports.default = configuration;
