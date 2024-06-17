import {
  FungibleConditionCode,
  MAX_STRING_LENGTH_BYTES,
  NonFungibleConditionCode,
  PostConditionPrincipalId,
  PostConditionType,
  StacksWireType,
} from './constants';
import { c32addressDecode } from 'c32check';
import { AddressWire } from './common';
import { ClarityValue } from './clarity';
import { exceedsMaxLengthBytes } from './utils';

/**
 * A contract identifier string given as `<address>.<contract-name>`
 */
export type ContractIdString = `${string}.${string}`;

/**
 * An asset name string given as `<contract-id>::<token-name>` aka `<contract-address>.<contract-name>::<token-name>`
 */
export type AssetString = `${ContractIdString}::${string}`;

export interface StandardPrincipalWire {
  readonly type: StacksWireType.Principal;
  readonly prefix: PostConditionPrincipalId.Standard;
  readonly address: AddressWire;
}

export interface ContractPrincipalWire {
  readonly type: StacksWireType.Principal;
  readonly prefix: PostConditionPrincipalId.Contract;
  readonly address: AddressWire;
  readonly contractName: LengthPrefixedStringWire;
}

export interface LengthPrefixedStringWire {
  readonly type: StacksWireType.LengthPrefixedString;
  readonly content: string;
  readonly lengthPrefixBytes: number;
  readonly maxLengthBytes: number;
}

export interface AssetWire {
  readonly type: StacksWireType.Asset;
  readonly address: AddressWire;
  readonly contractName: LengthPrefixedStringWire;
  readonly assetName: LengthPrefixedStringWire;
}

export interface STXPostConditionWire {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.STX;
  readonly principal: PostConditionPrincipalWire;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
}

export interface FungiblePostConditionWire {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.Fungible;
  readonly principal: PostConditionPrincipalWire;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
  readonly asset: AssetWire;
}

export interface NonFungiblePostConditionWire {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.NonFungible;
  readonly principal: PostConditionPrincipalWire;
  readonly conditionCode: NonFungibleConditionCode;
  /** Structure that identifies the token type. */
  readonly asset: AssetWire;
  /** The Clarity value that names the token instance. */
  readonly assetName: ClarityValue;
}

export type PostConditionWire =
  | STXPostConditionWire
  | FungiblePostConditionWire
  | NonFungiblePostConditionWire;

export type PostConditionPrincipalWire = StandardPrincipalWire | ContractPrincipalWire;

export function parseAssetString(id: AssetString): AssetWire {
  const [assetAddress, assetContractName, assetTokenName] = id.split(/\.|::/);
  const asset = createAsset(assetAddress, assetContractName, assetTokenName);
  return asset;
}

export function createLPString(content: string): LengthPrefixedStringWire;
export function createLPString(
  content: string,
  lengthPrefixBytes: number
): LengthPrefixedStringWire;
export function createLPString(
  content: string,
  lengthPrefixBytes: number,
  maxLengthBytes: number
): LengthPrefixedStringWire;
export function createLPString(
  content: string,
  lengthPrefixBytes?: number,
  maxLengthBytes?: number
): LengthPrefixedStringWire {
  const prefixLength = lengthPrefixBytes || 1;
  const maxLength = maxLengthBytes || MAX_STRING_LENGTH_BYTES;
  if (exceedsMaxLengthBytes(content, maxLength)) {
    throw new Error(`String length exceeds maximum bytes ${maxLength}`);
  }
  return {
    type: StacksWireType.LengthPrefixedString,
    content,
    lengthPrefixBytes: prefixLength,
    maxLengthBytes: maxLength,
  };
}

export function createAsset(
  addressString: string,
  contractName: string,
  assetName: string
): AssetWire {
  return {
    type: StacksWireType.Asset,
    address: createAddress(addressString),
    contractName: createLPString(contractName),
    assetName: createLPString(assetName),
  };
}

export function createAddress(c32AddressString: string): AddressWire {
  const addressData = c32addressDecode(c32AddressString);
  return {
    type: StacksWireType.Address,
    version: addressData[0],
    hash160: addressData[1],
  };
}

/**
 * Parses a principal string for either a standard principal or contract principal.
 * @param principalString - String in the format `{address}.{contractName}`
 * @example "SP13N5TE1FBBGRZD1FCM49QDGN32WAXM2E5F8WT2G.example-contract"
 * @example "SP13N5TE1FBBGRZD1FCM49QDGN32WAXM2E5F8WT2G"
 */
export function parsePrincipalString(
  principalString: string
): StandardPrincipalWire | ContractPrincipalWire {
  if (principalString.includes('.')) {
    const [address, contractName] = principalString.split('.');
    return createContractPrincipal(address, contractName);
  } else {
    return createStandardPrincipal(principalString);
  }
}

export function createContractPrincipal(
  addressString: string,
  contractName: string
): ContractPrincipalWire {
  const addr = createAddress(addressString);
  const name = createLPString(contractName);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Contract,
    address: addr,
    contractName: name,
  };
}

export function createStandardPrincipal(addressString: string): StandardPrincipalWire {
  const addr = createAddress(addressString);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Standard,
    address: addr,
  };
}
