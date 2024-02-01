import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Predict, Punter, Round } from '../artifacts/ts'
import { encodeByteVec, ZERO_ADDRESS } from '@alephium/web3'
import { randomContractId } from '@alephium/web3-test'

const deployTemplate: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {

   const punterTemplateId = deployer.getDeployContractResult('Punter')
   const roundTemplateId = deployer.getDeployContractResult('Round')


  await deployer.deployContract(Predict, {
    initialFields: {
       gameContract: '00' ,
       punterTemplateId:'00',
       roundTemplateId: '00',
       title: '',
       epoch: 0n,
       operator: ZERO_ADDRESS,
       feesBasisPts: 0n,
       repeatEvery: 0n,
       claimedByAnyoneDelay: 0n,
       playerCounter: 0n
    }
  })

}



export default deployTemplate