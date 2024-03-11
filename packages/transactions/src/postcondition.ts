import { IntegerType, intToBigInt } from '@stacks/common';
import { ClarityValue } from './clarity';
import {
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionType,
  StacksMessageType,
} from './constants';
import {
  Asset,
  AssetString,
  FungiblePostCondition,
  NonFungiblePostCondition,
  PostConditionPrincipal,
  STXPostCondition,
  parseAssetString,
  parsePrincipalString,
} from './postcondition-types';

export function createSTXPostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: FungibleConditionCode,
  amount: IntegerType
): STXPostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.STX,
    principal,
    conditionCode,
    amount: intToBigInt(amount, false),
  };
}

export function createFungiblePostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: FungibleConditionCode,
  amount: IntegerType,
  asset: AssetString | Asset
): FungiblePostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof asset === 'string') {
    asset = parseAssetString(asset);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.Fungible,
    principal,
    conditionCode,
    amount: intToBigInt(amount, false),
    asset: asset,
  };
}

export function createNonFungiblePostCondition(
  principal: string | PostConditionPrincipal,
  conditionCode: NonFungibleConditionCode,
  asset: AssetString | Asset,
  assetName: ClarityValue
): NonFungiblePostCondition {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof asset === 'string') {
    asset = parseAssetString(asset);
  }

  return {
    type: StacksMessageType.PostCondition,
    conditionType: PostConditionType.NonFungible,
    principal,
    conditionCode,
    asset: asset,
    assetName,
  };
}
