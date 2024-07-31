import {
  FungibleConditionCode,
  MAX_STRING_LENGTH_BYTES,
  NonFungibleConditionCode,
  PostConditionPrincipalId,
  PostConditionType,
  StacksWireType,
} from './constants';
import { c32addressDecode } from 'c32check';
import { Address } from './common';
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

export interface StandardPrincipal {
  readonly type: StacksWireType.Principal;
  readonly prefix: PostConditionPrincipalId.Standard;
  readonly address: Address;
}

export interface ContractPrincipal {
  readonly type: StacksWireType.Principal;
  readonly prefix: PostConditionPrincipalId.Contract;
  readonly address: Address;
  readonly contractName: LengthPrefixedString;
}

export interface LengthPrefixedString {
  readonly type: StacksWireType.LengthPrefixedString;
  readonly content: string;
  readonly lengthPrefixBytes: number;
  readonly maxLengthBytes: number;
}

export interface Asset {
  readonly type: StacksWireType.Asset;
  readonly address: Address;
  readonly contractName: LengthPrefixedString;
  readonly assetName: LengthPrefixedString;
}

export interface STXPostCondition {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.STX;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
}

export interface FungiblePostCondition {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.Fungible;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
  readonly asset: Asset;
}

export interface NonFungiblePostCondition {
  readonly type: StacksWireType.PostCondition;
  readonly conditionType: PostConditionType.NonFungible;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: NonFungibleConditionCode;
  /** Structure that identifies the token type. */
  readonly asset: Asset;
  /** The Clarity value that names the token instance. */
  readonly assetName: ClarityValue;
}

export type PostCondition = STXPostCondition | FungiblePostCondition | NonFungiblePostCondition;

export type PostConditionPrincipal = StandardPrincipal | ContractPrincipal;

export function parseAssetString(id: AssetString): Asset {
  const [assetAddress, assetContractName, assetTokenName] = id.split(/\.|::/);
  const asset = createAsset(assetAddress, assetContractName, assetTokenName);
  return asset;
}

export function createLPString(content: string): LengthPrefixedString;
export function createLPString(content: string, lengthPrefixBytes: number): LengthPrefixedString;
export function createLPString(
  content: string,
  lengthPrefixBytes: number,
  maxLengthBytes: number
): LengthPrefixedString;
export function createLPString(
  content: string,
  lengthPrefixBytes?: number,
  maxLengthBytes?: number
): LengthPrefixedString {
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

export function createAsset(addressString: string, contractName: string, assetName: string): Asset {
  return {
    type: StacksWireType.Asset,
    address: createAddress(addressString),
    contractName: createLPString(contractName),
    assetName: createLPString(assetName),
  };
}

export function createAddress(c32AddressString: string): Address {
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
): StandardPrincipal | ContractPrincipal {
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
): ContractPrincipal {
  const addr = createAddress(addressString);
  const name = createLPString(contractName);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Contract,
    address: addr,
    contractName: name,
  };
}

export function createStandardPrincipal(addressString: string): StandardPrincipal {
  const addr = createAddress(addressString);
  return {
    type: StacksWireType.Principal,
    prefix: PostConditionPrincipalId.Standard,
    address: addr,
  };
}
