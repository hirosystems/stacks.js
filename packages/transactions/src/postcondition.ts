import { IntegerType, intToBigInt } from '@stacks/common';
import {
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
  StacksMessageType,
} from './constants';

import {
  AssetInfo,
  PostConditionPrincipal,
  parseAssetInfoString,
  parsePrincipalString,
  STXPostCondition,
  FungiblePostCondition,
  NonFungiblePostCondition,
} from './postcondition-types';

import { ClarityValue } from './clarity';

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
    amount: intToBigInt(amount, false),
    assetInfo,
  };
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
