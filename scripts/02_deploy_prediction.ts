import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Predictalph } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployAuction: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (network.settings === undefined) {
    throw new Error('No settings specified')
  }

  const punterTemplateId = deployer.getDeployContractResult('Punter')
  const roundTemplateId = deployer.getDeployContractResult('Round')
  const dynamicArrayContract = deployer.getDeployContractResult('DynamicArrayForInt')

  const settings = network.settings
  const auction = await deployer.deployContract(Predictalph, {
    initialFields: {
        punterTemplateId: punterTemplateId.contractInstance.contractId,
        roundTemplateId: roundTemplateId.contractInstance.contractId,
        dynamicArrayForIntId: dynamicArrayContract.contractInstance.contractId,
        epoch: 0n,
        operator: ZERO_ADDRESS,
        feesBasisPts: 0n,
        repeatEvery: 0n,
    },

  })

  console.log(`Prediction contract id: ${auction.contractInstance.contractId}`)
  console.log(`Prediction contract address: ${auction.contractInstance.address}`)
}

export default deployAuction