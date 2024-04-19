/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  EventSubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
} from "@alephium/web3";
import { default as RoundMultipleChoiceContractJson } from "../multiple-choice/RoundMultipleChoice.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace RoundMultipleChoiceTypes {
  export type Fields = {
    prediction: HexString;
    epoch: bigint;
    feesBasisPts: bigint;
    bidEndTimestamp: bigint;
    operator: Address;
    endBeforeEnd: boolean;
    rewardsComputed: boolean;
    totalAmountBoost: bigint;
    sideWon: bigint;
    totalAmount: bigint;
    amountPunters: [bigint, bigint, bigint];
    treasuryAmount: bigint;
    rewardAmount: bigint;
    rewardBaseCalAmount: bigint;
    counterAttendees: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getEndRoundTime: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRewardAmount: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRewardBaseCalAmount: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRoundEpoch: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    canEndBeforeEnd: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<boolean>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };
}

class Factory extends ContractFactory<
  RoundMultipleChoiceInstance,
  RoundMultipleChoiceTypes.Fields
> {
  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as RoundMultipleChoiceTypes.Fields;
  }

  consts = {
    ErrorCodes: {
      InvalidCaller: BigInt(100),
      NotAllPlayerClaimed: BigInt(101),
      RewardsAlreadyComputed: BigInt(103),
      BidTimestampNotReached: BigInt(104),
      RewardsNotComputed: BigInt(105),
    },
  };

  at(address: string): RoundMultipleChoiceInstance {
    return new RoundMultipleChoiceInstance(address);
  }

  tests = {
    getEndRoundTime: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getEndRoundTime", params);
    },
    getRewardAmount: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getRewardAmount", params);
    },
    getRewardBaseCalAmount: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getRewardBaseCalAmount", params);
    },
    getRoundEpoch: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getRoundEpoch", params);
    },
    canEndBeforeEnd: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<boolean>> => {
      return testMethod(this, "canEndBeforeEnd", params);
    },
    updateAmount: async (
      params: TestContractParamsWithoutMaps<
        RoundMultipleChoiceTypes.Fields,
        { from: Address; amount: bigint; side: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "updateAmount", params);
    },
    calculateRewards: async (
      params: TestContractParamsWithoutMaps<
        RoundMultipleChoiceTypes.Fields,
        { sideWinning: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "calculateRewards", params);
    },
    boost: async (
      params: TestContractParamsWithoutMaps<
        RoundMultipleChoiceTypes.Fields,
        { from: Address; amount: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "boost", params);
    },
    destroy: async (
      params: Omit<
        TestContractParamsWithoutMaps<RoundMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "destroy", params);
    },
    userClaimRewards: async (
      params: TestContractParamsWithoutMaps<
        RoundMultipleChoiceTypes.Fields,
        { addressPunter: Address; amountBid: bigint; sideBid: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "userClaimRewards", params);
    },
  };
}

// Use this object to test and deploy the contract
export const RoundMultipleChoice = new Factory(
  Contract.fromJson(
    RoundMultipleChoiceContractJson,
    "",
    "cadd74b22e40eadbea19e6451396f03418f1de6a48c0ec0c40cb9db152e1e213"
  )
);

// Use this class to interact with the blockchain
export class RoundMultipleChoiceInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<RoundMultipleChoiceTypes.State> {
    return fetchContractState(RoundMultipleChoice, this);
  }

  methods = {
    getEndRoundTime: async (
      params?: RoundMultipleChoiceTypes.CallMethodParams<"getEndRoundTime">
    ): Promise<
      RoundMultipleChoiceTypes.CallMethodResult<"getEndRoundTime">
    > => {
      return callMethod(
        RoundMultipleChoice,
        this,
        "getEndRoundTime",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRewardAmount: async (
      params?: RoundMultipleChoiceTypes.CallMethodParams<"getRewardAmount">
    ): Promise<
      RoundMultipleChoiceTypes.CallMethodResult<"getRewardAmount">
    > => {
      return callMethod(
        RoundMultipleChoice,
        this,
        "getRewardAmount",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRewardBaseCalAmount: async (
      params?: RoundMultipleChoiceTypes.CallMethodParams<"getRewardBaseCalAmount">
    ): Promise<
      RoundMultipleChoiceTypes.CallMethodResult<"getRewardBaseCalAmount">
    > => {
      return callMethod(
        RoundMultipleChoice,
        this,
        "getRewardBaseCalAmount",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRoundEpoch: async (
      params?: RoundMultipleChoiceTypes.CallMethodParams<"getRoundEpoch">
    ): Promise<RoundMultipleChoiceTypes.CallMethodResult<"getRoundEpoch">> => {
      return callMethod(
        RoundMultipleChoice,
        this,
        "getRoundEpoch",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    canEndBeforeEnd: async (
      params?: RoundMultipleChoiceTypes.CallMethodParams<"canEndBeforeEnd">
    ): Promise<
      RoundMultipleChoiceTypes.CallMethodResult<"canEndBeforeEnd">
    > => {
      return callMethod(
        RoundMultipleChoice,
        this,
        "canEndBeforeEnd",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends RoundMultipleChoiceTypes.MultiCallParams>(
    calls: Calls
  ): Promise<RoundMultipleChoiceTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      RoundMultipleChoice,
      this,
      calls,
      getContractByCodeHash
    )) as RoundMultipleChoiceTypes.MultiCallResults<Calls>;
  }
}
