import {
  FungibleConditionCode,
  MAX_STRING_LENGTH_BYTES,
  NonFungibleConditionCode,
  PostConditionPrincipalID,
  PostConditionType,
  StacksMessageType,
} from './constants';
import { c32addressDecode } from 'c32check';
import { Address } from './common';
import { ClarityValue } from './clarity';
import { exceedsMaxLengthBytes } from './utils';

export interface StandardPrincipal {
  readonly type: StacksMessageType.Principal;
  readonly prefix: PostConditionPrincipalID.Standard;
  readonly address: Address;
}

export interface ContractPrincipal {
  readonly type: StacksMessageType.Principal;
  readonly prefix: PostConditionPrincipalID.Contract;
  readonly address: Address;
  readonly contractName: LengthPrefixedString;
}

export interface LengthPrefixedString {
  readonly type: StacksMessageType.LengthPrefixedString;
  readonly content: string;
  readonly lengthPrefixBytes: number;
  readonly maxLengthBytes: number;
}

export interface AssetInfo {
  readonly type: StacksMessageType.AssetInfo;
  readonly address: Address;
  readonly contractName: LengthPrefixedString;
  readonly assetName: LengthPrefixedString;
}

export interface STXPostCondition {
  readonly type: StacksMessageType.PostCondition;
  readonly conditionType: PostConditionType.STX;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
}

export interface FungiblePostCondition {
  readonly type: StacksMessageType.PostCondition;
  readonly conditionType: PostConditionType.Fungible;
  readonly principal: PostConditionPrincipal;
  readonly conditionCode: FungibleConditionCode;
  readonly amount: bigint;
  readonly assetInfo: AssetInfo;
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

export function parseAssetInfoString(id: string): AssetInfo {
  const [assetAddress, assetContractName, assetTokenName] = id.split(/\.|::/);
  const assetInfo = createAssetInfo(assetAddress, assetContractName, assetTokenName);
  return assetInfo;
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
    type: StacksMessageType.LengthPrefixedString,
    content,
    lengthPrefixBytes: prefixLength,
    maxLengthBytes: maxLength,
  };
}

export function createAssetInfo(
  addressString: string,
  contractName: string,
  assetName: string
): AssetInfo {
  return {
    type: StacksMessageType.AssetInfo,
    address: createAddress(addressString),
    contractName: createLPString(contractName),
    assetName: createLPString(assetName),
  };
}

export function createAddress(c32AddressString: string): Address {
  const addressData = c32addressDecode(c32AddressString);
  return {
    type: StacksMessageType.Address,
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
    type: StacksMessageType.Principal,
    prefix: PostConditionPrincipalID.Contract,
    address: addr,
    contractName: name,
  };
}

export function createStandardPrincipal(addressString: string): StandardPrincipal {
  const addr = createAddress(addressString);
  return {
    type: StacksMessageType.Principal,
    prefix: PostConditionPrincipalID.Standard,
    address: addr,
  };
}

export type PostCondition = STXPostCondition | FungiblePostCondition | NonFungiblePostCondition;

export type PostConditionPrincipal = StandardPrincipal | ContractPrincipal;
