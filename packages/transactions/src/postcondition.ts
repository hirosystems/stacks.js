import {
  FungibleConditionCode,
  NonFungibleConditionCode,
  PostConditionMode,
  PostConditionPrincipalId,
  PostConditionType,
} from './constants';
import { PostCondition, PostConditionModeName } from './postcondition-types';
import {
  PostConditionWire,
  StacksWireType,
  parseAssetString,
  parsePrincipalString,
  serializePostConditionWire,
} from './wire';

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
export function postConditionToWire(postcondition: PostCondition): PostConditionWire {
  switch (postcondition.type) {
    case 'stx-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.STX,
        principal:
          postcondition.address === 'origin'
            ? { type: StacksWireType.Principal, prefix: PostConditionPrincipalId.Origin }
            : parsePrincipalString(postcondition.address),
        conditionCode: FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        amount: BigInt(postcondition.amount),
      };
    case 'ft-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.Fungible,
        principal:
          postcondition.address === 'origin'
            ? { type: StacksWireType.Principal, prefix: PostConditionPrincipalId.Origin }
            : parsePrincipalString(postcondition.address),
        conditionCode: FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        amount: BigInt(postcondition.amount),
        asset: parseAssetString(postcondition.asset),
      };
    case 'nft-postcondition':
      return {
        type: StacksWireType.PostCondition,
        conditionType: PostConditionType.NonFungible,
        principal:
          postcondition.address === 'origin'
            ? { type: StacksWireType.Principal, prefix: PostConditionPrincipalId.Origin }
            : parsePrincipalString(postcondition.address),
        conditionCode: NON_FUNGIBLE_COMPARATOR_MAPPING[postcondition.condition],
        asset: parseAssetString(postcondition.asset),
        assetName: postcondition.assetId,
      };
    default:
      throw new Error('Invalid post condition type');
  }
}

/**
 * Convert a post condition to a hex string
 * @param postcondition - The post condition object to convert
 * @returns The hex string representation of the post condition
 *
 * @example
 * ```ts
 * import { postConditionToHex } from '@stacks/transactions';
 *
 * const hex = postConditionToHex({
 *   type: 'stx-postcondition',
 *   address: 'ST00000000000000000002Q6VF78',
 *   condition: 'eq',
 *   amount: '1000000000000000000',
 * });
 * ```
 * @see {@link StxPostCondition}, {@link FungiblePostCondition}, {@link NonFungiblePostCondition}
 */
export function postConditionToHex(postcondition: PostCondition): string {
  const wire = postConditionToWire(postcondition);
  return serializePostConditionWire(wire);
}

/** @internal */
export function postConditionModeFrom(
  mode: PostConditionModeName | PostConditionMode
): PostConditionMode {
  if (typeof mode === 'number') return mode;
  if (mode === 'allow') return PostConditionMode.Allow;
  if (mode === 'deny') return PostConditionMode.Deny;
  throw new Error(`Invalid post condition mode: ${mode}`);
}
