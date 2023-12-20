import { Deployer, DeployFunction } from "@alephium/cli";
import { Settings } from "../alephium.config";
import { DynamicArrayForInt } from "../artifacts/ts";

const deployDynamicArray: DeployFunction<Settings> = async (
  deployer: Deployer
): Promise<void> => {
  await deployer.deployContract(DynamicArrayForInt, {
    initialFields: {},
  });
};

export default deployDynamicArray;
