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
  addStdIdToFields,
  encodeContractFields,
} from "@alephium/web3";
import { default as PredictMultipleChoiceContractJson } from "../multiple-choice/PredictMultipleChoice.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace PredictMultipleChoiceTypes {
  export type Fields = {
    punterTemplateId: HexString;
    roundTemplateId: HexString;
    title: HexString;
    epoch: bigint;
    operator: Address;
    feesBasisPts: bigint;
    repeatEvery: bigint;
    claimedByAnyoneDelay: bigint;
    playerCounter: bigint;
    endBeforeEnd: boolean;
  };

  export type State = ContractState<Fields>;

  export type BetEvent = ContractEvent<{
    contractId: HexString;
    from: Address;
    epoch: bigint;
    amount: bigint;
    side: bigint;
    claimedByAnyoneTimestamp: bigint;
  }>;
  export type RoundEndedEvent = ContractEvent<{
    contractId: HexString;
    epoch: bigint;
    sideWon: bigint;
  }>;
  export type RoundStartedEvent = ContractEvent<{
    contractId: HexString;
    epoch: bigint;
  }>;
  export type ClaimedEvent = ContractEvent<{
    contractId: HexString;
    punterAddress: Address;
    from: Address;
    amount: bigint;
    epoch: bigint;
  }>;

  export interface CallMethodTable {
    getArrayElem: {
      params: CallContractParams<{ array: HexString; index: bigint }>;
      result: CallContractResult<HexString>;
    };
    getTitle: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
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
  PredictMultipleChoiceInstance,
  PredictMultipleChoiceTypes.Fields
> {
  encodeFields(fields: PredictMultipleChoiceTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as PredictMultipleChoiceTypes.Fields;
  }

  eventIndex = { Bet: 0, RoundEnded: 1, RoundStarted: 2, Claimed: 3 };
  consts = {
    ErrorCodes: {
      PunterChoiceNotExists: BigInt(1),
      InvalidPunterChoiceAddress: BigInt(2),
      InvalidCaller: BigInt(3),
      BidTimestampReached: BigInt(4),
      RoundAlreadyRunning: BigInt(5),
      RoundDidntEnd: BigInt(6),
      RoundNotExists: BigInt(7),
      AlreadyPlayed: BigInt(8),
      NotEnoughAlph: BigInt(9),
      CannotBeClaimedYet: BigInt(10),
      NotAllPlayerClaimed: BigInt(11),
    },
    SubContractTypes: { RoundMultipleChoice: "00", PunterChoice: "01" },
  };

  at(address: string): PredictMultipleChoiceInstance {
    return new PredictMultipleChoiceInstance(address);
  }

  tests = {
    getArrayElem: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { array: HexString; index: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getArrayElem", params);
    },
    getRoundByEpoch: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { epochToGet: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getRoundByEpoch", params);
    },
    getRoundByEpochByteVec: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { epochToGet: HexString }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getRoundByEpochByteVec", params);
    },
    getBetInfoByEpoch: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { from: Address; epochToGet: HexString }
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getBetInfoByEpoch", params);
    },
    getTitle: async (
      params: Omit<
        TestContractParamsWithoutMaps<PredictMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<HexString>> => {
      return testMethod(this, "getTitle", params);
    },
    startRound: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { from: Address }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "startRound", params);
    },
    endRound: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { sideWon: bigint; immediatelyStart: boolean }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "endRound", params);
    },
    bid: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { amount: bigint; side: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "bid", params);
    },
    withdraw: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { from: Address; arrayEpochIn: HexString; addressToClaim: Address }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "withdraw", params);
    },
    destroyRound: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { epochArray: HexString }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "destroyRound", params);
    },
    destroy: async (
      params: Omit<
        TestContractParamsWithoutMaps<PredictMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "destroy", params);
    },
    boostRound: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { amount: bigint; epochToBoost: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "boostRound", params);
    },
    setNewRepeatEvery: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { newRecurrence: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setNewRepeatEvery", params);
    },
    setNewFees: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { basisPts: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setNewFees", params);
    },
    setNewOperator: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { newOperator: Address }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setNewOperator", params);
    },
    setNewClaimedByAnyone: async (
      params: TestContractParamsWithoutMaps<
        PredictMultipleChoiceTypes.Fields,
        { newClaimedByAnyoneDelay: bigint }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setNewClaimedByAnyone", params);
    },
    setEndBeforeEnd: async (
      params: Omit<
        TestContractParamsWithoutMaps<PredictMultipleChoiceTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "setEndBeforeEnd", params);
    },
  };
}

// Use this object to test and deploy the contract
export const PredictMultipleChoice = new Factory(
  Contract.fromJson(
    PredictMultipleChoiceContractJson,
    "=10+6=1-1=2-2+a2=2-2+bd=2-2+c6=2-2+70=2-2+cc=2-3+9=1-2=2+5=1-1=2-2+9c=2-1+b=3-2+d=1-3=2-2+e=1-3=2-2+f4440444144425=81-1+e=24+7e024020526f756e644d756c7469706c6543686f69636520636f6e747261637420696420001601=25-1+d=18+16017e024020526f756e644d756c7469706c6543686f69636520636f6e74726163742069642000=1816",
    "c3de0f802c4792d2bb804ac63bffec83c8b6935870baa2edfaa7b2f808a6c677",
    []
  )
);

// Use this class to interact with the blockchain
export class PredictMultipleChoiceInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<PredictMultipleChoiceTypes.State> {
    return fetchContractState(PredictMultipleChoice, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeBetEvent(
    options: EventSubscribeOptions<PredictMultipleChoiceTypes.BetEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      PredictMultipleChoice.contract,
      this,
      options,
      "Bet",
      fromCount
    );
  }

  subscribeRoundEndedEvent(
    options: EventSubscribeOptions<PredictMultipleChoiceTypes.RoundEndedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      PredictMultipleChoice.contract,
      this,
      options,
      "RoundEnded",
      fromCount
    );
  }

  subscribeRoundStartedEvent(
    options: EventSubscribeOptions<PredictMultipleChoiceTypes.RoundStartedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      PredictMultipleChoice.contract,
      this,
      options,
      "RoundStarted",
      fromCount
    );
  }

  subscribeClaimedEvent(
    options: EventSubscribeOptions<PredictMultipleChoiceTypes.ClaimedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      PredictMultipleChoice.contract,
      this,
      options,
      "Claimed",
      fromCount
    );
  }

  subscribeAllEvents(
    options: EventSubscribeOptions<
      | PredictMultipleChoiceTypes.BetEvent
      | PredictMultipleChoiceTypes.RoundEndedEvent
      | PredictMultipleChoiceTypes.RoundStartedEvent
      | PredictMultipleChoiceTypes.ClaimedEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvents(
      PredictMultipleChoice.contract,
      this,
      options,
      fromCount
    );
  }

  methods = {
    getArrayElem: async (
      params: PredictMultipleChoiceTypes.CallMethodParams<"getArrayElem">
    ): Promise<PredictMultipleChoiceTypes.CallMethodResult<"getArrayElem">> => {
      return callMethod(
        PredictMultipleChoice,
        this,
        "getArrayElem",
        params,
        getContractByCodeHash
      );
    },
    getTitle: async (
      params?: PredictMultipleChoiceTypes.CallMethodParams<"getTitle">
    ): Promise<PredictMultipleChoiceTypes.CallMethodResult<"getTitle">> => {
      return callMethod(
        PredictMultipleChoice,
        this,
        "getTitle",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends PredictMultipleChoiceTypes.MultiCallParams>(
    calls: Calls
  ): Promise<PredictMultipleChoiceTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      PredictMultipleChoice,
      this,
      calls,
      getContractByCodeHash
    )) as PredictMultipleChoiceTypes.MultiCallResults<Calls>;
  }
}
