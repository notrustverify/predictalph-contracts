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
import { default as PunterContractJson } from "../Punter.ral.json";
import { getContractByCodeHash } from "./contracts";

// Custom types for the contract
export namespace PunterTypes {
  export type Fields = {
    predictionContractId: HexString;
    punterAddress: Address;
    epoch: bigint;
    side: boolean;
    amountBid: bigint;
    claimedByAnyoneAt: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getAddress: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<Address>;
    };
    getBid: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<boolean>;
    };
    getAmountBid: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getRoundEpoch: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getClaimedByAnyone: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
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

class Factory extends ContractFactory<PunterInstance, PunterTypes.Fields> {
  encodeFields(fields: PunterTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      []
    );
  }

  getInitialFieldsWithDefaultValues() {
    return this.contract.getInitialFieldsWithDefaultValues() as PunterTypes.Fields;
  }

  consts = { ErrorCodes: { InvalidCaller: BigInt(200) } };

  at(address: string): PunterInstance {
    return new PunterInstance(address);
  }

  tests = {
    getAddress: async (
      params: Omit<
        TestContractParamsWithoutMaps<PunterTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<Address>> => {
      return testMethod(this, "getAddress", params);
    },
    getBid: async (
      params: Omit<
        TestContractParamsWithoutMaps<PunterTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<boolean>> => {
      return testMethod(this, "getBid", params);
    },
    getAmountBid: async (
      params: Omit<
        TestContractParamsWithoutMaps<PunterTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getAmountBid", params);
    },
    getRoundEpoch: async (
      params: Omit<
        TestContractParamsWithoutMaps<PunterTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getRoundEpoch", params);
    },
    getClaimedByAnyone: async (
      params: Omit<
        TestContractParamsWithoutMaps<PunterTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResultWithoutMaps<bigint>> => {
      return testMethod(this, "getClaimedByAnyone", params);
    },
    destroy: async (
      params: TestContractParamsWithoutMaps<
        PunterTypes.Fields,
        { from: Address }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "destroy", params);
    },
  };
}

// Use this object to test and deploy the contract
export const Punter = new Factory(
  Contract.fromJson(
    PunterContractJson,
    "",
    "75f2d8bff475bcac7c2b6f3a6c7ecfffadcf7727e469f9001de2aadada85b12a",
    []
  )
);

// Use this class to interact with the blockchain
export class PunterInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<PunterTypes.State> {
    return fetchContractState(Punter, this);
  }

  methods = {
    getAddress: async (
      params?: PunterTypes.CallMethodParams<"getAddress">
    ): Promise<PunterTypes.CallMethodResult<"getAddress">> => {
      return callMethod(
        Punter,
        this,
        "getAddress",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getBid: async (
      params?: PunterTypes.CallMethodParams<"getBid">
    ): Promise<PunterTypes.CallMethodResult<"getBid">> => {
      return callMethod(
        Punter,
        this,
        "getBid",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getAmountBid: async (
      params?: PunterTypes.CallMethodParams<"getAmountBid">
    ): Promise<PunterTypes.CallMethodResult<"getAmountBid">> => {
      return callMethod(
        Punter,
        this,
        "getAmountBid",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getRoundEpoch: async (
      params?: PunterTypes.CallMethodParams<"getRoundEpoch">
    ): Promise<PunterTypes.CallMethodResult<"getRoundEpoch">> => {
      return callMethod(
        Punter,
        this,
        "getRoundEpoch",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
    getClaimedByAnyone: async (
      params?: PunterTypes.CallMethodParams<"getClaimedByAnyone">
    ): Promise<PunterTypes.CallMethodResult<"getClaimedByAnyone">> => {
      return callMethod(
        Punter,
        this,
        "getClaimedByAnyone",
        params === undefined ? {} : params,
        getContractByCodeHash
      );
    },
  };

  async multicall<Calls extends PunterTypes.MultiCallParams>(
    calls: Calls
  ): Promise<PunterTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      Punter,
      this,
      calls,
      getContractByCodeHash
    )) as PunterTypes.MultiCallResults<Calls>;
  }
}
