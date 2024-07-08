import { ContractIdString } from '../types';
import { ClarityValue } from './clarityValue';
import { ClarityType } from './constants';

export type BooleanCV = TrueCV | FalseCV;

export interface TrueCV {
  type: ClarityType.BoolTrue;
}

export interface FalseCV {
  type: ClarityType.BoolFalse;
}

export interface BufferCV {
  readonly type: ClarityType.Buffer;
  readonly value: string;
}

export interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: bigint | number | string;
}

export interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: bigint | number | string;
}

export interface ListCV<T extends ClarityValue = ClarityValue> {
  type: ClarityType.List;
  value: T[];
}

export type OptionalCV<T extends ClarityValue = ClarityValue> = NoneCV | SomeCV<T>;

export interface NoneCV {
  readonly type: ClarityType.OptionalNone;
}

export interface SomeCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.OptionalSome;
  readonly value: T;
}

export type PrincipalCV = StandardPrincipalCV | ContractPrincipalCV;

export interface StandardPrincipalCV {
  readonly type: ClarityType.PrincipalStandard;
  readonly value: string;
}

export interface ContractPrincipalCV {
  readonly type: ClarityType.PrincipalContract;
  readonly value: ContractIdString;
}

export type ResponseCV = ResponseErrorCV | ResponseOkCV;

export interface ResponseErrorCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseErr;
  readonly value: T;
}

export interface ResponseOkCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseOk;
  readonly value: T;
}

export interface StringAsciiCV {
  readonly type: ClarityType.StringASCII;
  readonly value: string;
}

export interface StringUtf8CV {
  readonly type: ClarityType.StringUTF8;
  readonly value: string;
}

export type TupleData<T extends ClarityValue = ClarityValue> = { [key: string]: T };

export interface TupleCV<T extends TupleData = TupleData> {
  type: ClarityType.Tuple;
  value: T;
}
