import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  StacksMessageType,
} from './constants';

import { BufferArray } from './utils';

import {
  AssetInfo,
  serializeAssetInfo,
  deserializeAssetInfo,
  PostConditionPrincipal,
  serializePrincipal,
  deserializePrincipal,
  parseAssetInfoString,
  parsePrincipalString,
} from './types';

import * as BigNum from 'bn.js';
import { BufferReader } from './bufferReader';
import { ClarityValue, serializeCV, deserializeCV } from './clarity';
import { DeserializationError } from './errors';

export type PostCondition = STXPostCondition | FungiblePostCondition | NonFungiblePostCondition;

export interface STXPostCondition {
  readonly type: StacksMessageType.PostCondition;
  readonly conditionType: PostConditionType.STX;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: BigNum;
}

export function createSTXPostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: FungibleConditionCode,
  amount: BigNum
): STXPostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.STX,
    principal,
    conditionCode,
    amount,
  };
}

export interface FungiblePostCondition {
  readonly type: StacksMessageType.PostCondition;
  readonly conditionType: PostConditionType.Fungible;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: BigNum;
  readonly assetInfo: AssetInfo;
}

export function createFungiblePostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: FungibleConditionCode,
  amount: BigNum,
  assetInfo: string | AssetInfo
): FungiblePostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof assetInfo === 'string') {
    assetInfo = parseAssetInfoString(assetInfo);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.Fungible,
    principal,
    conditionCode,
    amount,
    assetInfo,
  };
}

export interface NonFungiblePostCondition {
  readonly type: StacksMessageType.PostCondition;
  readonly conditionType: PostConditionType.NonFungible;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: NonFungibleConditionCode;
  /** Structure that identifies the token type. */
  readonly assetInfo: AssetInfo;
  /** The Clarity value that names the token instance. */
  readonly assetName: ClarityValue;
}

export function createNonFungiblePostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: NonFungibleConditionCode,
  assetInfo: string | AssetInfo,
  assetName: ClarityValue
): NonFungiblePostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof assetInfo === 'string') {
    assetInfo = parseAssetInfoString(assetInfo);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.NonFungible,
    principal,
    conditionCode,
    assetInfo,
    assetName,
  };
}

export function serializePostCondition(postCondition: PostCondition): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendByte(postCondition.conditionType);
  bufferArray.push(serializePrincipal(postCondition.principal));

  if (
    postCondition.conditionType === PostConditionType.Fungible ||
    postCondition.conditionType === PostConditionType.NonFungible
  ) {
    bufferArray.push(serializeAssetInfo(postCondition.assetInfo));
  }

  if (postCondition.conditionType === PostConditionType.NonFungible) {
    bufferArray.push(serializeCV(postCondition.assetName));
  }

  bufferArray.appendByte(postCondition.conditionCode);

  if (
    postCondition.conditionType === PostConditionType.STX ||
    postCondition.conditionType === PostConditionType.Fungible
  ) {
    bufferArray.push(postCondition.amount.toArrayLike(Buffer, 'be', 8));
  }

  return bufferArray.concatBuffer();
}

export function deserializePostCondition(bufferReader: BufferReader): PostCondition {
  const postConditionType = bufferReader.readUInt8Enum(PostConditionType, n => {
    throw new DeserializationError(`Could not read ${n} as PostConditionType`);
  });

  const principal = deserializePrincipal(bufferReader);

  let conditionCode;
  let assetInfo;
  let amount;
  switch (postConditionType) {
    case PostConditionType.STX:
      conditionCode = bufferReader.readUInt8Enum(FungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      amount = new BigNum(bufferReader.readBuffer(8).toString('hex'), 16);
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.STX,
        principal,
        conditionCode,
        amount,
      };
    case PostConditionType.Fungible:
      assetInfo = deserializeAssetInfo(bufferReader);
      conditionCode = bufferReader.readUInt8Enum(FungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      amount = new BigNum(bufferReader.readBuffer(8).toString('hex'), 16);
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.Fungible,
        principal,
        conditionCode,
        amount,
        assetInfo,
      };
    case PostConditionType.NonFungible:
      assetInfo = deserializeAssetInfo(bufferReader);
      const assetName = deserializeCV(bufferReader);
      conditionCode = bufferReader.readUInt8Enum(NonFungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.NonFungible,
        principal,
        conditionCode,
        assetInfo,
        assetName,
      };
  }
}
