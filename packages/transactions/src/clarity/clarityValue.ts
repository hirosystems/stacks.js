import {
  BooleanCV,
  OptionalCV,
  BufferCV,
  IntCV,
  UIntCV,
  StandardPrincipalCV,
  ContractPrincipalCV,
  ResponseErrorCV,
  ResponseOkCV,
  ListCV,
  TupleCV,
  StringAsciiCV,
  StringUtf8CV,
} from '.';

import { principalToString } from './types/principalCV';
import { CLARITY_INT_SIZE } from '../constants';
import { isClarityName } from '../utils';

/**
 * Type IDs corresponding to each of the Clarity value types as described here:
 * {@link https://github.com/blockstack/blockstack-core/blob/sip/sip-005/sip/sip-005-blocks-and-transactions.md#clarity-value-representation}
 */
export enum ClarityType {
  Int = 0x00,
  UInt = 0x01,
  Buffer = 0x02,
  BoolTrue = 0x03,
  BoolFalse = 0x04,
  PrincipalStandard = 0x05,
  PrincipalContract = 0x06,
  ResponseOk = 0x07,
  ResponseErr = 0x08,
  OptionalNone = 0x09,
  OptionalSome = 0x0a,
  List = 0x0b,
  Tuple = 0x0c,
  StringASCII = 0x0d,
  StringUTF8 = 0x0e,
}

export type ClarityValue =
  | BooleanCV
  | OptionalCV
  | BufferCV
  | IntCV
  | UIntCV
  | StandardPrincipalCV
  | ContractPrincipalCV
  | ResponseErrorCV
  | ResponseOkCV
  | ListCV
  | TupleCV
  | StringAsciiCV
  | StringUtf8CV;

export function cvToString(val: ClarityValue, encoding: 'tryAscii' | 'hex' = 'tryAscii'): string {
  switch (val.type) {
    case ClarityType.BoolTrue:
      return 'true';
    case ClarityType.BoolFalse:
      return 'false';
    case ClarityType.Int:
      return val.value.fromTwos(CLARITY_INT_SIZE).toString();
    case ClarityType.UInt:
      return `u${val.value.toString()}`;
    case ClarityType.Buffer:
      if (encoding === 'tryAscii') {
        const str = val.buffer.toString('ascii');
        if (/[ -~]/.test(str)) {
          return JSON.stringify(str);
        }
      }
      return `0x${val.buffer.toString('hex')}`;
    case ClarityType.OptionalNone:
      return 'none';
    case ClarityType.OptionalSome:
      return `(some ${cvToString(val.value, encoding)})`;
    case ClarityType.ResponseErr:
      return `(err ${cvToString(val.value, encoding)})`;
    case ClarityType.ResponseOk:
      return `(ok ${cvToString(val.value, encoding)})`;
    case ClarityType.PrincipalStandard:
    case ClarityType.PrincipalContract:
      return principalToString(val);
    case ClarityType.List:
      return `(list ${val.list.map(v => cvToString(v, encoding)).join(' ')})`;
    case ClarityType.Tuple:
      return `(tuple ${Object.keys(val.data)
        .map(key => `(${key} ${cvToString(val.data[key], encoding)})`)
        .join(' ')})`;
    case ClarityType.StringASCII:
      return `"${val.data}"`;
    case ClarityType.StringUTF8:
      return `u"${val.data}"`;
  }
}

export function getCVTypeString(val: ClarityValue): string {
  switch (val.type) {
    case ClarityType.BoolTrue:
    case ClarityType.BoolFalse:
      return 'bool';
    case ClarityType.Int:
      return 'int';
    case ClarityType.UInt:
      return 'uint';
    case ClarityType.Buffer:
      return `(buff ${val.buffer.length})`;
    case ClarityType.OptionalNone:
      return '(optional none)';
    case ClarityType.OptionalSome:
      return `(optional ${getCVTypeString(val.value)})`;
    case ClarityType.ResponseErr:
      return `(responseError ${getCVTypeString(val.value)})`;
    case ClarityType.ResponseOk:
      return `(responseOk ${getCVTypeString(val.value)})`;
    case ClarityType.PrincipalStandard:
    case ClarityType.PrincipalContract:
      return 'principal';
    case ClarityType.List:
      return `(list ${val.list.length} ${getCVTypeString(val.list[0])})`;
    case ClarityType.Tuple:
      return `(tuple ${Object.keys(val.data)
        .map(key => `(${key} ${getCVTypeString(val.data[key])})`)
        .join(' ')})`;
    case ClarityType.StringASCII:
      return `(string-ascii ${Buffer.from(val.data, 'ascii').length})`;
    case ClarityType.StringUTF8:
      return `(string-utf8 ${Buffer.from(val.data, 'utf8').length})`;
  }
}
