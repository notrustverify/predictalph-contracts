import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { PredictChoice, PredictMultipleChoice } from '../artifacts/ts'
import { binToHex, ZERO_ADDRESS } from '@alephium/web3'

const deployPredictionMultipleChoice: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (network.settings === undefined) {
    throw new Error('No settings specified')
  }

  const punterTemplateId = deployer.getDeployContractResult('PunterChoice')
  const roundTemplateId = deployer.getDeployContractResult('RoundMultipleChoice')


  const ONE_WEEK_SEC = 604800
  const ONE_DAY_SEC = 86400
  const MAY = 1717199999
  const settings = network.settings
  const title = "Real Madrid vs. Borussia Dortmund"

  const predict = await deployer.deployContract(PredictMultipleChoice, {
    initialFields: {
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       epoch: 0n,
       operator: deployer.account.address,
       feesBasisPts: 100n,
       //repeatEvery: BigInt(1800*1000),
       repeatEvery: BigInt(1717268400 * 1000),
       claimedByAnyoneDelay: BigInt((ONE_WEEK_SEC + 1715194800) * 1000),
       title: binToHex(new TextEncoder().encode(title)),
       playerCounter: 0n,
       endBeforeEnd: true
    },

  },"PredictMultipleChoiceRealBorussia")

  console.log(`Deploying Choice ${title}`)
  console.log(`Punter contract id: ${punterTemplateId.contractInstance.contractId}`)
  console.log(`Punter contract address: ${punterTemplateId.contractInstance.address}`)
  console.log(`Round contract id: ${roundTemplateId.contractInstance.contractId}`)
  console.log(`Round contract address: ${roundTemplateId.contractInstance.address}`)
  console.log(`Prediction contract id: ${predict.contractInstance.contractId}`)
  console.log(`Prediction contract address: ${predict.contractInstance.address}\n\n`)
  
}

export default deployPredictionMultipleChoice