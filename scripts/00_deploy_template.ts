import { Deployer, DeployFunction } from '@alephium/cli'
import { Settings } from '../alephium.config'
import { Punter, Round } from '../artifacts/ts'
import { encodeByteVec, ZERO_ADDRESS } from '@alephium/web3'
import { randomContractId } from '@alephium/web3-test'

const deployTemplate: DeployFunction<Settings> = async (deployer: Deployer): Promise<void> => {
  await deployer.deployContract(Punter, {
    initialFields: {
        prediction: '00',
        punterAddress: ZERO_ADDRESS,
        epoch: 0n,
        upBid: false,
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
        counterAttendees: 0n
    }
  })
}

export default deployTemplate