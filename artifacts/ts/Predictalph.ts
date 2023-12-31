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
} from "@alephium/web3";
import { default as PredictalphContractJson } from "../Predictalph.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace PredictalphTypes {
  export type Fields = {
    punterTemplateId: HexString;
    roundTemplateId: HexString;
    epoch: bigint;
    operator: Address;
    feesBasisPts: bigint;
    repeatEvery: bigint;
    claimedByAnyoneDelay: bigint;
  };

  export type State = ContractState<Fields>;

  export type BetBullEvent = ContractEvent<{
    from: Address;
    epoch: bigint;
    amount: bigint;
    up: boolean;
    claimedByAnyoneTimestamp: bigint;
  }>;
  export type BetBearEvent = ContractEvent<{
    from: Address;
    epoch: bigint;
    amount: bigint;
    up: boolean;
    claimedByAnyoneTimestamp: bigint;
  }>;
  export type RoundEndedEvent = ContractEvent<{ epoch: bigint; price: bigint }>;
  export type RoundStartedEvent = ContractEvent<{
    epoch: bigint;
    price: bigint;
  }>;
  export type ClaimedEvent = ContractEvent<{
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
  PredictalphInstance,
  PredictalphTypes.Fields
> {
  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as PredictalphTypes.Fields;
  }

  eventIndex = {
    BetBull: 0,
    BetBear: 1,
    RoundEnded: 2,
    RoundStarted: 3,
    Claimed: 4,
  };
  consts = {
    ErrorCodes: {
      PunterNotExists: BigInt(1),
      InvalidPunterAddress: BigInt(2),
      InvalidCaller: BigInt(3),
      BidTimestampReached: BigInt(4),
      RoundAlreadyRunning: BigInt(5),
      RoundDidntEnd: BigInt(6),
      RoundNotExists: BigInt(7),
      AlreadyPlayed: BigInt(8),
      NotEnoughAlph: BigInt(9),
      CannotBeClaimedYet: BigInt(10),
    },
    SubContractTypes: { Round: "00", Punter: "01" },
  };

  at(address: string): PredictalphInstance {
    return new PredictalphInstance(address);
  }

  tests = {
    getArrayElem: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { array: HexString; index: bigint }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getArrayElem", params);
    },
    getCurrentRound: async (
      params: Omit<
        TestContractParams<PredictalphTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getCurrentRound", params);
    },
    getRoundByEpoch: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { epochToGet: HexString }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getRoundByEpoch", params);
    },
    getBetInfoByEpoch: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { from: Address; epochToGet: HexString }
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getBetInfoByEpoch", params);
    },
    startRound: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { from: Address; price: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "startRound", params);
    },
    endRound: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { actualPrice: bigint; immediatelyStart: boolean }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "endRound", params);
    },
    bid: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { amount: bigint; up: boolean }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "bid", params);
    },
    withdraw: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { arrayEpochIn: HexString }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdraw", params);
    },
    withdrawAddress: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { arrayEpochIn: HexString; addressToClaim: Address }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "withdrawAddress", params);
    },
    destroyRound: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { epochArray: HexString }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "destroyRound", params);
    },
    boostRound: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { amount: bigint; epochToBoost: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "boostRound", params);
    },
    setNewRepeatEvery: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { newRecurrence: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "setNewRepeatEvery", params);
    },
    setNewFees: async (
      params: TestContractParams<PredictalphTypes.Fields, { basisPts: bigint }>
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "setNewFees", params);
    },
    setNewOperator: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { newOperator: Address }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "setNewOperator", params);
    },
    setNewClaimedByAnyone: async (
      params: TestContractParams<
        PredictalphTypes.Fields,
        { newClaimedByAnyoneDelay: bigint }
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "setNewClaimedByAnyone", params);
    },
  };
}

// Use this object to test and deploy the contract
export const Predictalph = new Factory(
  Contract.fromJson(
    PredictalphContractJson,
    "=10-2+54=2-1+8=3-1+9=2-2=1+54=2+a=1-1=1-1+25=1-1=2-1=1-2=1-1=2-2+9e=2-1=1+24401441144214=2-2+1=1-3=1-3=1-3+1=81-1+e=24+7e0212526f756e6420636f6e747261637420696420001600=25-1+d=22+7e0212526f756e6420636f6e747261637420696420001601=81-1+8=82+16037e0212526f756e6420636f6e74726163742069642000a00016017e031041637475616c2065706f6368206973201220776974682073746172742070726963652000=1630",
    "0ac29513c4719fe384ef331f1fbc66b3804c052ac7764de4483dd28b2bfe6883"
  )
);

// Use this class to interact with the blockchain
export class PredictalphInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<PredictalphTypes.State> {
    return fetchContractState(Predictalph, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeBetBullEvent(
    options: EventSubscribeOptions<PredictalphTypes.BetBullEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Predictalph.contract,
      this,
      options,
      "BetBull",
      fromCount
    );
  }

  subscribeBetBearEvent(
    options: EventSubscribeOptions<PredictalphTypes.BetBearEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Predictalph.contract,
      this,
      options,
      "BetBear",
      fromCount
    );
  }

  subscribeRoundEndedEvent(
    options: EventSubscribeOptions<PredictalphTypes.RoundEndedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Predictalph.contract,
      this,
      options,
      "RoundEnded",
      fromCount
    );
  }

  subscribeRoundStartedEvent(
    options: EventSubscribeOptions<PredictalphTypes.RoundStartedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Predictalph.contract,
      this,
      options,
      "RoundStarted",
      fromCount
    );
  }

  subscribeClaimedEvent(
    options: EventSubscribeOptions<PredictalphTypes.ClaimedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Predictalph.contract,
      this,
      options,
      "Claimed",
      fromCount
    );
  }

  subscribeAllEvents(
    options: EventSubscribeOptions<
      | PredictalphTypes.BetBullEvent
      | PredictalphTypes.BetBearEvent
      | PredictalphTypes.RoundEndedEvent
      | PredictalphTypes.RoundStartedEvent
      | PredictalphTypes.ClaimedEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvents(
      Predictalph.contract,
      this,
      options,
      fromCount
    );
  }

  methods = {
    getArrayElem: async (
      params: PredictalphTypes.CallMethodParams<"getArrayElem">
    ): Promise<PredictalphTypes.CallMethodResult<"getArrayElem">> => {
      return callMethod(
        Predictalph,
        this,
        "getArrayElem",
        params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends PredictalphTypes.MultiCallParams>(
    calls: Calls
  ): Promise<PredictalphTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      Predictalph,
      this,
      calls,
      getContractByCodeHash
    )) as PredictalphTypes.MultiCallResults<Calls>;
  }
}
