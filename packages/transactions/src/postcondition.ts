import { IntegerType, intToBigInt } from '@stacks/common';
import { ClarityValue } from './clarity';
import {
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionType,
  StacksWireType,
} from './constants';
import {
  AssetString,
  AssetWire,
  FungiblePostConditionWire,
  NonFungiblePostConditionWire,
  PostConditionPrincipalWire,
  STXPostConditionWire,
  parseAssetString,
  parsePrincipalString,
} from './postcondition-types';

export function createSTXPostCondition(
  principal: string | PostConditionPrincipalWire,
  conditionCode: FungibleConditionCode,
  amount: IntegerType
): STXPostConditionWire {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }

  return {
    type: StacksWireType.PostCondition,
    conditionType: PostConditionType.STX,
    principal,
    conditionCode,
    amount: intToBigInt(amount, false),
  };
}

export function createFungiblePostCondition(
  principal: string | PostConditionPrincipalWire,
  conditionCode: FungibleConditionCode,
  amount: IntegerType,
  asset: AssetString | AssetWire
): FungiblePostConditionWire {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof asset === 'string') {
    asset = parseAssetString(asset);
  }

  return {
    type: StacksWireType.PostCondition,
    conditionType: PostConditionType.Fungible,
    principal,
    conditionCode,
    amount: intToBigInt(amount, false),
    asset: asset,
  };
}

export function createNonFungiblePostCondition(
  principal: string | PostConditionPrincipalWire,
  conditionCode: NonFungibleConditionCode,
  asset: AssetString | AssetWire,
  assetName: ClarityValue
): NonFungiblePostConditionWire {
  if (typeof principal === 'string') {
    principal = parsePrincipalString(principal);
  }
  if (typeof asset === 'string') {
    asset = parseAssetString(asset);
  }

  return {
    type: StacksWireType.PostCondition,
    conditionType: PostConditionType.NonFungible,
    principal,
    conditionCode,
    asset: asset,
    assetName,
  };
}
