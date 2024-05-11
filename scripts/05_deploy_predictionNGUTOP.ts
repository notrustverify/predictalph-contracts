import { Deployer, DeployFunction, Network } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { PredictChoice } from '../artifacts/ts'
import { binToHex, ZERO_ADDRESS } from '@alephium/web3'

const deployPredictChoice: DeployFunction<Settings> = async (
  deployer: Deployer,
  network: Network<Settings>
): Promise<void> => {
  if (network.settings === undefined) {
    throw new Error('No settings specified')
  }
/*
  const punterTemplateId = deployer.getDeployContractResult('Punter')
  const roundTemplateId = deployer.getDeployContractResult('RoundChoice')


  const ONE_WEEK_SEC = 604800
  const ONE_DAY_SEC = 86400
  const DECEMBER_2024 = 1733011200
  const settings = network.settings
  const title = "BTC will hit $100K before end of year 2024"

  const predict = await deployer.deployContract(PredictChoice, {
    initialFields: {
       punterTemplateId: punterTemplateId.contractInstance.contractId,
       roundTemplateId: roundTemplateId.contractInstance.contractId,
       epoch: 0n,
       operator: deployer.account.address,
       feesBasisPts: 100n,
       //repeatEvery: BigInt(1800*1000),
       repeatEvery: BigInt(DECEMBER_2024 * 1000),
       claimedByAnyoneDelay: BigInt((ONE_WEEK_SEC + DECEMBER_2024) * 1000),
       title: binToHex(new TextEncoder().encode(title)),
       playerCounter: 0n,
       endBeforeEnd: false
    },

  },"PredictChoiceBTC100K")

  console.log(`\nDeploying Choice ${title}`)
  console.log(`Punter contract id: ${punterTemplateId.contractInstance.contractId}`)
  console.log(`Punter contract address: ${punterTemplateId.contractInstance.address}`)
  console.log(`Round contract id: ${roundTemplateId.contractInstance.contractId}`)
  console.log(`Round contract address: ${roundTemplateId.contractInstance.address}`)
  console.log(`Prediction contract id: ${predict.contractInstance.contractId}`)
  console.log(`Prediction contract address: ${predict.contractInstance.address}\n\n`)
  */
}

export default deployPredictChoice