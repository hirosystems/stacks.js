import {
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionType,
  StacksWireType,
} from './constants';
import {
  FungiblePostCondition,
  FungiblePostConditionWire,
  NonFungiblePostCondition,
  NonFungiblePostConditionWire,
  PostCondition,
  PostConditionWire,
  STXPostConditionWire,
  StxPostCondition,
  parseAssetString,
  parsePrincipalString,
} from './postcondition-types';

const FUNGIBLE_COMPARATOR_MAPPING = {
  eq: FungibleConditionCode.Equal,
  gt: FungibleConditionCode.Greater,
  lt: FungibleConditionCode.Less,
  gte: FungibleConditionCode.GreaterEqual,
  lte: FungibleConditionCode.LessEqual,
};

const NON_FUNGIBLE_COMPARATOR_MAPPING = {
  sent: NonFungibleConditionCode.Sends,
  'not-sent': NonFungibleConditionCode.DoesNotSend,
};

/** @ignore */
export function postConditionToWire(postcondition: StxPostCondition): STXPostConditionWire;
export function postConditionToWire(
  postcondition: FungiblePostCondition
): FungiblePostConditionWire;
export function postConditionToWire(
  postcondition: NonFungiblePostCondition
): NonFungiblePostConditionWire;
export function postConditionToWire<T extends PostCondition>(postcondition: T): PostConditionWire {
  switch (postcondition.type) {
    case 'stx-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.STX,
        principal: parsePrincipalString(postcondition.address),
        conditionCode: FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        amount: BigInt(postcondition.amount),
      };
    case 'ft-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.Fungible,
        principal: parsePrincipalString(postcondition.address),
        conditionCode: FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        amount: BigInt(postcondition.amount),
        asset: parseAssetString(postcondition.asset),
      };
    case 'nft-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.NonFungible,
        principal: parsePrincipalString(postcondition.address),
        conditionCode: NON_FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        asset: parseAssetString(postcondition.asset),
        assetName: postcondition.assetId,
      };
    default:
      throw new Error('Invalid post condition type');
  }
}
