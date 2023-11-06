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

export interface ClarityAbiVariable {
  name: string;
  access: 'variable' | 'constant';
  type: ClarityAbiType;
}

export interface ClarityAbiMap {
  name: string;
  key: {
    name: string;
    type: ClarityAbiType;
  }[];
  value: {
    name: string;
    type: ClarityAbiType;
  }[];
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
