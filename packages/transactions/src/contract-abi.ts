import { hexToBytes, utf8ToBytes } from '@stacks/common';
import {
  ClarityType,
  ClarityValue,
  bufferCV,
  bufferCVFromString,
  contractPrincipalCV,
  falseCV,
  getCVTypeString,
  intCV,
  noneCV,
  someCV,
  standardPrincipalCV,
  stringAsciiCV,
  stringUtf8CV,
  trueCV,
  uintCV,
} from './clarity';
import { NotImplementedError } from './errors';
import { cloneDeep } from './utils';
import { ContractCallPayload } from './wire';

// From https://github.com/blockstack/stacks-blockchain-sidecar/blob/master/src/event-stream/contract-abi.ts

export type ClarityAbiTypeBuffer = { buffer: { length: number } };
export type ClarityAbiTypeStringAscii = { 'string-ascii': { length: number } };
export type ClarityAbiTypeStringUtf8 = { 'string-utf8': { length: number } };
export type ClarityAbiTypeResponse = { response: { ok: ClarityAbiType; error: ClarityAbiType } };
export type ClarityAbiTypeOptional = { optional: ClarityAbiType };
export type ClarityAbiTypeTuple = { tuple: { name: string; type: ClarityAbiType }[] };
export type ClarityAbiTypeList = { list: { type: ClarityAbiType; length: number } };

export type ClarityAbiTypeUInt128 = 'uint128';
export type ClarityAbiTypeInt128 = 'int128';
export type ClarityAbiTypeBool = 'bool';
export type ClarityAbiTypePrincipal = 'principal';
export type ClarityAbiTypeTraitReference = 'trait_reference';
export type ClarityAbiTypeNone = 'none';

export type ClarityAbiTypePrimitive =
  | ClarityAbiTypeUInt128
  | ClarityAbiTypeInt128
  | ClarityAbiTypeBool
  | ClarityAbiTypePrincipal
  | ClarityAbiTypeTraitReference
  | ClarityAbiTypeNone;

export type ClarityAbiType =
  | ClarityAbiTypePrimitive
  | ClarityAbiTypeBuffer
  | ClarityAbiTypeResponse
  | ClarityAbiTypeOptional
  | ClarityAbiTypeTuple
  | ClarityAbiTypeList
  | ClarityAbiTypeStringAscii
  | ClarityAbiTypeStringUtf8
  | ClarityAbiTypeTraitReference;

export enum ClarityAbiTypeId {
  ClarityAbiTypeUInt128 = 1,
  ClarityAbiTypeInt128 = 2,
  ClarityAbiTypeBool = 3,
  ClarityAbiTypePrincipal = 4,
  ClarityAbiTypeNone = 5,
  ClarityAbiTypeBuffer = 6,
  ClarityAbiTypeResponse = 7,
  ClarityAbiTypeOptional = 8,
  ClarityAbiTypeTuple = 9,
  ClarityAbiTypeList = 10,
  ClarityAbiTypeStringAscii = 11,
  ClarityAbiTypeStringUtf8 = 12,
  ClarityAbiTypeTraitReference = 13,
}

export const isClarityAbiPrimitive = (val: ClarityAbiType): val is ClarityAbiTypePrimitive =>
  typeof val === 'string';
export const isClarityAbiBuffer = (val: ClarityAbiType): val is ClarityAbiTypeBuffer =>
  (val as ClarityAbiTypeBuffer).buffer !== undefined;
export const isClarityAbiStringAscii = (val: ClarityAbiType): val is ClarityAbiTypeStringAscii =>
  (val as ClarityAbiTypeStringAscii)['string-ascii'] !== undefined;
export const isClarityAbiStringUtf8 = (val: ClarityAbiType): val is ClarityAbiTypeStringUtf8 =>
  (val as ClarityAbiTypeStringUtf8)['string-utf8'] !== undefined;
export const isClarityAbiResponse = (val: ClarityAbiType): val is ClarityAbiTypeResponse =>
  (val as ClarityAbiTypeResponse).response !== undefined;
export const isClarityAbiOptional = (val: ClarityAbiType): val is ClarityAbiTypeOptional =>
  (val as ClarityAbiTypeOptional).optional !== undefined;
export const isClarityAbiTuple = (val: ClarityAbiType): val is ClarityAbiTypeTuple =>
  (val as ClarityAbiTypeTuple).tuple !== undefined;
export const isClarityAbiList = (val: ClarityAbiType): val is ClarityAbiTypeList =>
  (val as ClarityAbiTypeList).list !== undefined;

export type ClarityAbiTypeUnion =
  | { id: ClarityAbiTypeId.ClarityAbiTypeUInt128; type: ClarityAbiTypeUInt128 }
  | { id: ClarityAbiTypeId.ClarityAbiTypeInt128; type: ClarityAbiTypeInt128 }
  | { id: ClarityAbiTypeId.ClarityAbiTypeBool; type: ClarityAbiTypeBool }
  | { id: ClarityAbiTypeId.ClarityAbiTypePrincipal; type: ClarityAbiTypePrincipal }
  | { id: ClarityAbiTypeId.ClarityAbiTypeTraitReference; type: ClarityAbiTypeTraitReference }
  | { id: ClarityAbiTypeId.ClarityAbiTypeNone; type: ClarityAbiTypeNone }
  | { id: ClarityAbiTypeId.ClarityAbiTypeBuffer; type: ClarityAbiTypeBuffer }
  | { id: ClarityAbiTypeId.ClarityAbiTypeResponse; type: ClarityAbiTypeResponse }
  | { id: ClarityAbiTypeId.ClarityAbiTypeOptional; type: ClarityAbiTypeOptional }
  | { id: ClarityAbiTypeId.ClarityAbiTypeTuple; type: ClarityAbiTypeTuple }
  | { id: ClarityAbiTypeId.ClarityAbiTypeList; type: ClarityAbiTypeList }
  | { id: ClarityAbiTypeId.ClarityAbiTypeStringAscii; type: ClarityAbiTypeStringAscii }
  | { id: ClarityAbiTypeId.ClarityAbiTypeStringUtf8; type: ClarityAbiTypeStringUtf8 };

export function getTypeUnion(val: ClarityAbiType): ClarityAbiTypeUnion {
  if (isClarityAbiPrimitive(val)) {
    if (val === 'uint128') {
      return { id: ClarityAbiTypeId.ClarityAbiTypeUInt128, type: val };
    } else if (val === 'int128') {
      return { id: ClarityAbiTypeId.ClarityAbiTypeInt128, type: val };
    } else if (val === 'bool') {
      return { id: ClarityAbiTypeId.ClarityAbiTypeBool, type: val };
    } else if (val === 'principal') {
      return { id: ClarityAbiTypeId.ClarityAbiTypePrincipal, type: val };
    } else if (val === 'trait_reference') {
      return { id: ClarityAbiTypeId.ClarityAbiTypeTraitReference, type: val };
    } else if (val === 'none') {
      return { id: ClarityAbiTypeId.ClarityAbiTypeNone, type: val };
    } else {
      throw new Error(`Unexpected Clarity ABI type primitive: ${JSON.stringify(val)}`);
    }
  } else if (isClarityAbiBuffer(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeBuffer, type: val };
  } else if (isClarityAbiResponse(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeResponse, type: val };
  } else if (isClarityAbiOptional(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeOptional, type: val };
  } else if (isClarityAbiTuple(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeTuple, type: val };
  } else if (isClarityAbiList(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeList, type: val };
  } else if (isClarityAbiStringAscii(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeStringAscii, type: val };
  } else if (isClarityAbiStringUtf8(val)) {
    return { id: ClarityAbiTypeId.ClarityAbiTypeStringUtf8, type: val };
  } else {
    throw new Error(`Unexpected Clarity ABI type: ${JSON.stringify(val)}`);
  }
}

/**
 * Convert a string to a Clarity value based on the ABI type.
 *
 * Currently does NOT support some nested Clarity ABI types:
 * - ClarityAbiTypeResponse
 * - ClarityAbiTypeTuple
 * - ClarityAbiTypeList
 */
export function encodeAbiClarityValue(
  value: string,
  type: ClarityAbiType | ClarityAbiTypeUnion
): ClarityValue {
  const union = (type as ClarityAbiTypeUnion).id
    ? (type as ClarityAbiTypeUnion)
    : getTypeUnion(type as ClarityAbiType);
  switch (union.id) {
    case ClarityAbiTypeId.ClarityAbiTypeUInt128:
      return uintCV(value);
    case ClarityAbiTypeId.ClarityAbiTypeInt128:
      return intCV(value);
    case ClarityAbiTypeId.ClarityAbiTypeBool:
      if (value === 'false' || value === '0') return falseCV();
      else if (value === 'true' || value === '1') return trueCV();
      else throw new Error(`Unexpected Clarity bool value: ${JSON.stringify(value)}`);
    case ClarityAbiTypeId.ClarityAbiTypePrincipal:
      if (value.includes('.')) {
        const [addr, name] = value.split('.');
        return contractPrincipalCV(addr, name);
      } else {
        return standardPrincipalCV(value);
      }
    case ClarityAbiTypeId.ClarityAbiTypeTraitReference:
      const [addr, name] = value.split('.');
      return contractPrincipalCV(addr, name);
    case ClarityAbiTypeId.ClarityAbiTypeNone:
      return noneCV();
    case ClarityAbiTypeId.ClarityAbiTypeBuffer:
      return bufferCV(hexToBytes(value));
    case ClarityAbiTypeId.ClarityAbiTypeStringAscii:
      return stringAsciiCV(value);
    case ClarityAbiTypeId.ClarityAbiTypeStringUtf8:
      return stringUtf8CV(value);
    case ClarityAbiTypeId.ClarityAbiTypeOptional:
      return someCV(encodeAbiClarityValue(value, union.type.optional));
    case ClarityAbiTypeId.ClarityAbiTypeResponse:
    case ClarityAbiTypeId.ClarityAbiTypeTuple:
    case ClarityAbiTypeId.ClarityAbiTypeList:
      throw new NotImplementedError(`Unsupported encoding for Clarity type: ${union.id}`);
    default:
      throw new Error(`Unexpected Clarity type ID: ${JSON.stringify(union)}`);
  }
}

/** @deprecated due to a breaking bug for the buffer encoding case, this was fixed and renamed to {@link clarityAbiStringToCV} */
export function encodeClarityValue(type: ClarityAbiType, value: string): ClarityValue;
export function encodeClarityValue(type: ClarityAbiTypeUnion, value: string): ClarityValue;
export function encodeClarityValue(
  type: ClarityAbiTypeUnion | ClarityAbiType,
  value: string
): ClarityValue {
  const union = (type as ClarityAbiTypeUnion).id
    ? (type as ClarityAbiTypeUnion)
    : getTypeUnion(type as ClarityAbiType);

  if (union.id === ClarityAbiTypeId.ClarityAbiTypeBuffer) {
    return bufferCV(utf8ToBytes(value)); // legacy behavior
  }

  return encodeAbiClarityValue(value, union);
}

export function getTypeString(val: ClarityAbiType): string {
  if (isClarityAbiPrimitive(val)) {
    if (val === 'int128') {
      return 'int';
    } else if (val === 'uint128') {
      return 'uint';
    }
    return val;
  } else if (isClarityAbiBuffer(val)) {
    return `(buff ${val.buffer.length})`;
  } else if (isClarityAbiStringAscii(val)) {
    return `(string-ascii ${val['string-ascii'].length})`;
  } else if (isClarityAbiStringUtf8(val)) {
    return `(string-utf8 ${val['string-utf8'].length})`;
  } else if (isClarityAbiResponse(val)) {
    return `(response ${getTypeString(val.response.ok)} ${getTypeString(val.response.error)})`;
  } else if (isClarityAbiOptional(val)) {
    return `(optional ${getTypeString(val.optional)})`;
  } else if (isClarityAbiTuple(val)) {
    return `(tuple ${val.tuple.map(t => `(${t.name} ${getTypeString(t.type)})`).join(' ')})`;
  } else if (isClarityAbiList(val)) {
    return `(list ${val.list.length} ${getTypeString(val.list.type)})`;
  } else {
    throw new Error(`Type string unsupported for Clarity type: ${JSON.stringify(val)}`);
  }
}

export interface ClarityAbiFunction {
  name: string;
  access: 'private' | 'public' | 'read_only';
  args: {
    name: string;
    type: ClarityAbiType;
  }[];
  outputs: {
    type: ClarityAbiType;
  };
}

export function abiFunctionToString(func: ClarityAbiFunction): string {
  const access = func.access === 'read_only' ? 'read-only' : func.access;
  return `(define-${access} (${func.name} ${func.args
    .map(arg => `(${arg.name} ${getTypeString(arg.type)})`)
    .join(' ')}))`;
}

export interface ClarityAbiVariable {
  name: string;
  access: 'variable' | 'constant';
  type: ClarityAbiType;
}

export interface ClarityAbiMap {
  name: string;
  key: ClarityAbiType;
  value: ClarityAbiType;
}

export interface ClarityAbiTypeFungibleToken {
  name: string;
}

export interface ClarityAbiTypeNonFungibleToken {
  name: string;
  type: ClarityAbiType;
}

export interface ClarityAbi {
  functions: ClarityAbiFunction[];
  variables: ClarityAbiVariable[];
  maps: ClarityAbiMap[];
  fungible_tokens: ClarityAbiTypeFungibleToken[];
  non_fungible_tokens: ClarityAbiTypeNonFungibleToken[];
}

function matchType(cv: ClarityValue, abiType: ClarityAbiType): boolean {
  const union = getTypeUnion(abiType);

  switch (cv.type) {
    case ClarityType.BoolTrue:
    case ClarityType.BoolFalse:
      return union.id === ClarityAbiTypeId.ClarityAbiTypeBool;
    case ClarityType.Int:
      return union.id === ClarityAbiTypeId.ClarityAbiTypeInt128;
    case ClarityType.UInt:
      return union.id === ClarityAbiTypeId.ClarityAbiTypeUInt128;
    case ClarityType.Buffer:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeBuffer &&
        union.type.buffer.length >= Math.ceil(cv.value.length / 2)
      );
    case ClarityType.StringASCII:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeStringAscii &&
        union.type['string-ascii'].length >= cv.value.length
      );
    case ClarityType.StringUTF8:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeStringUtf8 &&
        union.type['string-utf8'].length >= cv.value.length
      );
    case ClarityType.OptionalNone:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeNone ||
        union.id === ClarityAbiTypeId.ClarityAbiTypeOptional
      );
    case ClarityType.OptionalSome:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeOptional &&
        matchType(cv.value, union.type.optional)
      );
    case ClarityType.ResponseErr:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeResponse &&
        matchType(cv.value, union.type.response.error)
      );
    case ClarityType.ResponseOk:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypeResponse &&
        matchType(cv.value, union.type.response.ok)
      );
    case ClarityType.PrincipalContract:
      return (
        union.id === ClarityAbiTypeId.ClarityAbiTypePrincipal ||
        union.id === ClarityAbiTypeId.ClarityAbiTypeTraitReference
      );
    case ClarityType.PrincipalStandard:
      return union.id === ClarityAbiTypeId.ClarityAbiTypePrincipal;
    case ClarityType.List:
      return (
        union.id == ClarityAbiTypeId.ClarityAbiTypeList &&
        union.type.list.length >= cv.value.length &&
        cv.value.every(val => matchType(val, union.type.list.type))
      );
    case ClarityType.Tuple:
      if (union.id == ClarityAbiTypeId.ClarityAbiTypeTuple) {
        const tuple = cloneDeep(cv.value);
        for (let i = 0; i < union.type.tuple.length; i++) {
          const abiTupleEntry = union.type.tuple[i];
          const key = abiTupleEntry.name;
          const val = tuple[key];

          // if key exists in cv tuple, check if its type matches the abi
          // return false if key doesn't exist
          if (val) {
            if (!matchType(val, abiTupleEntry.type)) {
              return false;
            }
            delete tuple[key];
          } else {
            return false;
          }
        }
        return true;
      } else {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Validates a contract-call payload with a contract ABI
 *
 * @param {ContractCallPayload} payload - a contract-call payload
 * @param {ClarityAbi} abi - a contract ABI
 *
 * @returns {boolean} true if the payloads functionArgs type check against those in the ABI
 */
export function validateContractCall(payload: ContractCallPayload, abi: ClarityAbi): boolean {
  const filtered = abi.functions.filter(fn => fn.name === payload.functionName.content);
  if (filtered.length === 1) {
    const abiFunc = filtered[0];
    const abiArgs = abiFunc.args;

    if (payload.functionArgs.length !== abiArgs.length) {
      throw new Error(
        `Clarity function expects ${abiArgs.length} argument(s) but received ${payload.functionArgs.length}`
      );
    }

    for (let i = 0; i < payload.functionArgs.length; i++) {
      const payloadArg = payload.functionArgs[i];
      const abiArg = abiArgs[i];

      if (!matchType(payloadArg, abiArg.type)) {
        const argNum = i + 1;
        throw new Error(
          `Clarity function \`${
            payload.functionName.content
          }\` expects argument ${argNum} to be of type ${getTypeString(
            abiArg.type
          )}, not ${getCVTypeString(payloadArg)}`
        );
      }
    }

    return true;
  } else if (filtered.length === 0) {
    throw new Error(`ABI doesn't contain a function with the name ${payload.functionName.content}`);
  } else {
    throw new Error(
      `Malformed ABI. Contains multiple functions with the name ${payload.functionName.content}`
    );
  }
}

/**
 * Convert string input to Clarity value based on contract ABI data. Only handles Clarity
 * primitives and buffers. Responses, optionals, tuples and lists are not supported.
 *
 * @param {string} input - string to be parsed into Clarity value
 * @param {ClarityAbiType} type - the contract function argument object
 *
 * @returns {ClarityValue} returns a Clarity value
 */
export function parseToCV(input: string, type: ClarityAbiType): ClarityValue {
  const typeString = getTypeString(type);
  if (isClarityAbiPrimitive(type)) {
    if (type === 'uint128') {
      return uintCV(input);
    } else if (type === 'int128') {
      return intCV(input);
    } else if (type === 'bool') {
      if (input.toLowerCase() === 'true') {
        return trueCV();
      } else if (input.toLowerCase() === 'false') {
        return falseCV();
      } else {
        throw new Error(`Invalid bool value: ${input}`);
      }
    } else if (type === 'principal') {
      if (input.includes('.')) {
        const [address, contractName] = input.split('.');
        return contractPrincipalCV(address, contractName);
      } else {
        return standardPrincipalCV(input);
      }
    } else {
      throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
    }
  } else if (isClarityAbiBuffer(type)) {
    const inputLength = utf8ToBytes(input).byteLength;
    if (inputLength > type.buffer.length) {
      throw new Error(`Input exceeds specified buffer length limit of ${type.buffer.length}`);
    }
    return bufferCVFromString(input);
  } else if (isClarityAbiResponse(type)) {
    throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
  } else if (isClarityAbiOptional(type)) {
    throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
  } else if (isClarityAbiTuple(type)) {
    throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
  } else if (isClarityAbiList(type)) {
    throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
  } else {
    throw new Error(`Contract function contains unsupported Clarity ABI type: ${typeString}`);
  }
}
