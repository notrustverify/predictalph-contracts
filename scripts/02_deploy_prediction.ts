import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Game } from '../artifacts/ts'
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
  const predictTemplateId = deployer.getDeployContractResult('Predict')

  const ONE_WEEK_SEC = 604800
  const ONE_DAY_SEC = 86400
  const settings = network.settings
  const game = await deployer.deployContract(Game, {
    initialFields: {
       predictTemplateId: predictTemplateId.contractInstance.contractId,
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       operator: deployer.account.address,
       gameCounter: 0n
    },

  })

  console.log(`Punter contract id: ${punterTemplateId.contractInstance.contractId}`)
  console.log(`Punter contract address: ${punterTemplateId.contractInstance.address}`)
  console.log(`Round contract id: ${roundTemplateId.contractInstance.contractId}`)
  console.log(`Round contract address: ${roundTemplateId.contractInstance.address}`)
  console.log(`Predict contract id: ${predictTemplateId.contractInstance.contractId}`)
  console.log(`Predict contract address: ${predictTemplateId.contractInstance.address}`)
  console.log(`Game contract id: ${game.contractInstance.contractId}`)
  console.log(`Game contract address: ${game.contractInstance.address}`)
}

export default deployAuction