"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_1 = require("../artifacts/ts");
const deployDynamicArray = async (deployer) => {
    await deployer.deployContract(ts_1.DynamicArrayForInt, {
        initialFields: {},
    });
};
exports.default = deployDynamicArray;
