import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Punter, PunterChoice, Round, RoundChoice, RoundMultipleChoice, RoundMultipleChoiceInstance, RoundMultipleChoiceTypes } from '../artifacts/ts'
import { ZERO_ADDRESS } from '@alephium/web3'

const deployTemplate: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {
  await deployer.deployContract(Punter, {
    initialFields: {
        predictionContractId: '00',
        punterAddress: ZERO_ADDRESS,
        epoch: 0n,
        side: false,
        amountBid: 0n,
        claimedByAnyoneAt: 0n
    }
  })

  await deployer.deployContract(PunterChoice, {
   initialFields: {
       predictionContractId: '00',
       punterAddress: ZERO_ADDRESS,
       epoch: 0n,
       side: 0n,
       amountBid: 0n,
       claimedByAnyoneAt: 0n
   }
 })

  await deployer.deployContract(Round, {
    initialFields: {
        prediction: '00',
        epoch: 0n,
        priceStart: 0n,
        feesBasisPts: 0n,
        bidEndTimestamp: 0n,
        operator: ZERO_ADDRESS,
        rewardsComputed: false,
        priceEnd: 0n,
        totalAmount: 0n,
        amountUp: 0n,
        amountDown: 0n,
        treasuryAmount: 0n,
        rewardAmount: 0n,
        rewardBaseCalAmount: 0n,
        counterAttendees: 0n,
        totalAmountBoost: 0n
    }
  })

  await deployer.deployContract(RoundChoice, {
   initialFields: {
      prediction: '00',
      epoch: 0n,
      feesBasisPts: 0n,
      bidEndTimestamp: 0n,
      operator: ZERO_ADDRESS,
      rewardsComputed: false,
      totalAmount: 0n,
      amountTrue: 0n,
      amountFalse: 0n,
      treasuryAmount: 0n,
      rewardAmount: 0n,
      rewardBaseCalAmount: 0n,
      counterAttendees: 0n,
      totalAmountBoost: 0n,
      sideWon: false,
      endBeforeEnd: false
   }
 })


 await deployer.deployContract(RoundMultipleChoice, {
   initialFields: {
      prediction: "00",
      epoch: 0n,
      feesBasisPts: 0n,
      bidEndTimestamp: 0n,
      operator: ZERO_ADDRESS,
      rewardsComputed: false,
      totalAmount: 0n,
      treasuryAmount: 0n,
      rewardAmount: 0n,
      rewardBaseCalAmount: 0n,
      counterAttendees: 0n,
      totalAmountBoost: 0n,
      endBeforeEnd: false,
      sideWon: 0n,
      amountPunters: Array.from(Array(10), () => 0n) as RoundMultipleChoiceTypes.Fields["amountPunters"]
   }
 })
}

export default deployTemplate