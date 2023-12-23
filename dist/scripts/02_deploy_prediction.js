"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_1 = require("../artifacts/ts");
const deployAuction = async (deployer, network) => {
    if (network.settings === undefined) {
        throw new Error('No settings specified');
    }
    const punterTemplateId = deployer.getDeployContractResult('Punter');
    const roundTemplateId = deployer.getDeployContractResult('Round');
    const dynamicArrayContract = deployer.getDeployContractResult('DynamicArrayForInt');
    const settings = network.settings;
    const auction = await deployer.deployContract(ts_1.Predictalph, {
        initialFields: {
            punterTemplateId: punterTemplateId.contractInstance.contractId,
            roundTemplateId: roundTemplateId.contractInstance.contractId,
            dynamicArrayForIntId: dynamicArrayContract.contractInstance.contractId,
            epoch: 0n,
            operator: deployer.account.address,
            feesBasisPts: 0n,
            repeatEvery: BigInt(120 * 1000),
        },
    });
    console.log(`Prediction contract id: ${auction.contractInstance.contractId}`);
    console.log(`Prediction contract address: ${auction.contractInstance.address}`);
};
exports.default = deployAuction;
