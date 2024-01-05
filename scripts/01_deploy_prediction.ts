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


  const ONE_WEEK_SEC = 604800
  const ONE_DAY_SEC = 86400
  const settings = network.settings
  const auction = await deployer.deployContract(Predictalph, {
    initialFields: {
        punterTemplateId: punterTemplateId.contractInstance.contractId,
        roundTemplateId: roundTemplateId.contractInstance.contractId,
        epoch: 0n,
        operator: deployer.account.address,
        feesBasisPts: 100n,
        //repeatEvery: BigInt(1800*1000),
        repeatEvery: BigInt(60*1000),
        claimedByAnyoneDelay: BigInt(ONE_WEEK_SEC *1000)
        //claimedByAnyoneDelay: BigInt(ONE_DAY_SEC*1000)

    },

  })

  console.log(`Punter contract id: ${punterTemplateId.contractInstance.contractId}`)
  console.log(`Punter contract address: ${punterTemplateId.contractInstance.address}`)
  console.log(`Round contract id: ${roundTemplateId.contractInstance.contractId}`)
  console.log(`Round contract address: ${roundTemplateId.contractInstance.address}`)
  console.log(`Prediction contract id: ${auction.contractInstance.contractId}`)
  console.log(`Prediction contract address: ${auction.contractInstance.address}`)
}

export default deployAuction