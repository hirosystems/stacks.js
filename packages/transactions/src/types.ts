import {
  bytesToHex,
  bytesToUtf8,
  concatArray,
  hexToBytes,
  hexToInt,
  intToBytes,
  intToHex,
  utf8ToBytes,
} from '@stacks/common';
import {
  MEMO_MAX_LENGTH_BYTES,
  AddressHashMode,
  AddressVersion,
  TransactionVersion,
  StacksMessageType,
  PostConditionPrincipalID,
  PostConditionType,
  FungibleConditionCode,
  NonFungibleConditionCode,
} from './constants';

import { StacksPublicKey, serializePublicKey, deserializePublicKey, isCompressed } from './keys';

import {
  exceedsMaxLengthBytes,
  hashP2PKH,
  rightPadHexToLength,
  hashP2SH,
  hashP2WSH,
  hashP2WPKH,
} from './utils';

import { BytesReader } from './bytesReader';
import {
  PostCondition,
  StandardPrincipal,
  ContractPrincipal,
  PostConditionPrincipal,
  LengthPrefixedString,
  AssetInfo,
  createLPString,
} from './postcondition-types';
import { Payload, deserializePayload, serializePayload } from './payload';
import { DeserializationError } from './errors';
import {
  deserializeTransactionAuthField,
  deserializeMessageSignature,
  serializeMessageSignature,
  serializeTransactionAuthField,
  TransactionAuthField,
} from './signature';
import {
  MessageSignature,
  Address,
  addressHashModeToVersion,
  addressFromVersionHash,
} from './common';
import { deserializeCV, serializeCV } from './clarity';
export type StacksMessage =
  | Address
  | PostConditionPrincipal
  | LengthPrefixedString
  | LengthPrefixedList
  | Payload
  | MemoString
  | AssetInfo
  | PostCondition
  | StacksPublicKey
  | TransactionAuthField
  | MessageSignature;

export function serializeStacksMessage(message: StacksMessage): Uint8Array {
  switch (message.type) {
    case StacksMessageType.Address:
      return serializeAddress(message);
    case StacksMessageType.Principal:
      return serializePrincipal(message);
    case StacksMessageType.LengthPrefixedString:
      return serializeLPString(message);
    case StacksMessageType.MemoString:
      return serializeMemoString(message);
    case StacksMessageType.AssetInfo:
      return serializeAssetInfo(message);
    case StacksMessageType.PostCondition:
      return serializePostCondition(message);
    case StacksMessageType.PublicKey:
      return serializePublicKey(message);
    case StacksMessageType.LengthPrefixedList:
      return serializeLPList(message);
    case StacksMessageType.Payload:
      return serializePayload(message);
    case StacksMessageType.TransactionAuthField:
      return serializeTransactionAuthField(message);
    case StacksMessageType.MessageSignature:
      return serializeMessageSignature(message);
  }
}

export function deserializeStacksMessage(
  bytesReader: BytesReader,
  type: StacksMessageType,
  listType?: StacksMessageType
): StacksMessage {
  switch (type) {
    case StacksMessageType.Address:
      return deserializeAddress(bytesReader);
    case StacksMessageType.Principal:
      return deserializePrincipal(bytesReader);
    case StacksMessageType.LengthPrefixedString:
      return deserializeLPString(bytesReader);
    case StacksMessageType.MemoString:
      return deserializeMemoString(bytesReader);
    case StacksMessageType.AssetInfo:
      return deserializeAssetInfo(bytesReader);
    case StacksMessageType.PostCondition:
      return deserializePostCondition(bytesReader);
    case StacksMessageType.PublicKey:
      return deserializePublicKey(bytesReader);
    case StacksMessageType.Payload:
      return deserializePayload(bytesReader);
    case StacksMessageType.LengthPrefixedList:
      if (!listType) {
        throw new DeserializationError('No List Type specified');
      }
      return deserializeLPList(bytesReader, listType);
    case StacksMessageType.MessageSignature:
      return deserializeMessageSignature(bytesReader);
    default:
      throw new Error('Could not recognize StacksMessageType');
  }
}

export function createEmptyAddress(): Address {
  return {
    type: StacksMessageType.Address,
    version: AddressVersion.MainnetSingleSig,
    hash160: '0'.repeat(40),
  };
}

export function addressFromHashMode(
  hashMode: AddressHashMode,
  txVersion: TransactionVersion,
  data: string
): Address {
  const version = addressHashModeToVersion(hashMode, txVersion);
  return addressFromVersionHash(version, data);
}

export function addressFromPublicKeys(
  version: AddressVersion,
  hashMode: AddressHashMode,
  numSigs: number,
  publicKeys: StacksPublicKey[]
): Address {
  if (publicKeys.length === 0) {
    throw Error('Invalid number of public keys');
  }

  if (hashMode === AddressHashMode.SerializeP2PKH || hashMode === AddressHashMode.SerializeP2WPKH) {
    if (publicKeys.length !== 1 || numSigs !== 1) {
      throw Error('Invalid number of public keys or signatures');
    }
  }

  if (hashMode === AddressHashMode.SerializeP2WPKH || hashMode === AddressHashMode.SerializeP2WSH) {
    for (let i = 0; i < publicKeys.length; i++) {
      if (!isCompressed(publicKeys[i])) {
        throw Error('Public keys must be compressed for segwit');
      }
    }
  }

  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      return addressFromVersionHash(version, hashP2PKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2WPKH:
      return addressFromVersionHash(version, hashP2WPKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2SH:
      return addressFromVersionHash(version, hashP2SH(numSigs, publicKeys.map(serializePublicKey)));
    case AddressHashMode.SerializeP2WSH:
      return addressFromVersionHash(
        version,
        hashP2WSH(numSigs, publicKeys.map(serializePublicKey))
      );
  }
}

export function serializeAddress(address: Address): Uint8Array {
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(address.version, 1)));
  bytesArray.push(hexToBytes(address.hash160));
  return concatArray(bytesArray);
}

export function deserializeAddress(bytesReader: BytesReader): Address {
  const version = hexToInt(bytesToHex(bytesReader.readBytes(1)));
  const data = bytesToHex(bytesReader.readBytes(20));

  return { type: StacksMessageType.Address, version, hash160: data };
}

export function serializePrincipal(principal: PostConditionPrincipal): Uint8Array {
  const bytesArray = [];
  bytesArray.push(principal.prefix);
  bytesArray.push(serializeAddress(principal.address));
  if (principal.prefix === PostConditionPrincipalID.Contract) {
    bytesArray.push(serializeLPString(principal.contractName));
  }
  return concatArray(bytesArray);
}

export function deserializePrincipal(bytesReader: BytesReader): PostConditionPrincipal {
  const prefix = bytesReader.readUInt8Enum(PostConditionPrincipalID, n => {
    throw new DeserializationError(`Unexpected Principal payload type: ${n}`);
  });
  const address = deserializeAddress(bytesReader);
  if (prefix === PostConditionPrincipalID.Standard) {
    return { type: StacksMessageType.Principal, prefix, address } as StandardPrincipal;
  }
  const contractName = deserializeLPString(bytesReader);
  return {
    type: StacksMessageType.Principal,
    prefix,
    address,
    contractName,
  } as ContractPrincipal;
}

export function serializeLPString(lps: LengthPrefixedString) {
  const bytesArray = [];
  const contentBytes = utf8ToBytes(lps.content);
  const length = contentBytes.byteLength;
  bytesArray.push(hexToBytes(intToHex(length, lps.lengthPrefixBytes)));
  bytesArray.push(contentBytes);
  return concatArray(bytesArray);
}

export function deserializeLPString(
  bytesReader: BytesReader,
  prefixBytes?: number,
  maxLength?: number
): LengthPrefixedString {
  prefixBytes = prefixBytes ? prefixBytes : 1;
  const length = hexToInt(bytesToHex(bytesReader.readBytes(prefixBytes)));
  const content = bytesToUtf8(bytesReader.readBytes(length));
  return createLPString(content, prefixBytes, maxLength ?? 128);
}

export function codeBodyString(content: string): LengthPrefixedString {
  return createLPString(content, 4, 100_000);
}

export interface MemoString {
  readonly type: StacksMessageType.MemoString;
  readonly content: string;
}

export function createMemoString(content: string): MemoString {
  if (content && exceedsMaxLengthBytes(content, MEMO_MAX_LENGTH_BYTES)) {
    throw new Error(`Memo exceeds maximum length of ${MEMO_MAX_LENGTH_BYTES} bytes`);
  }
  return { type: StacksMessageType.MemoString, content };
}

export function serializeMemoString(memoString: MemoString): Uint8Array {
  const bytesArray = [];
  const contentBytes = utf8ToBytes(memoString.content);
  const paddedContent = rightPadHexToLength(bytesToHex(contentBytes), MEMO_MAX_LENGTH_BYTES * 2);
  bytesArray.push(hexToBytes(paddedContent));
  return concatArray(bytesArray);
}

export function deserializeMemoString(bytesReader: BytesReader): MemoString {
  const content = bytesToUtf8(bytesReader.readBytes(MEMO_MAX_LENGTH_BYTES));
  return { type: StacksMessageType.MemoString, content };
}

export function serializeAssetInfo(info: AssetInfo): Uint8Array {
  const bytesArray = [];
  bytesArray.push(serializeAddress(info.address));
  bytesArray.push(serializeLPString(info.contractName));
  bytesArray.push(serializeLPString(info.assetName));
  return concatArray(bytesArray);
}

export function deserializeAssetInfo(bytesReader: BytesReader): AssetInfo {
  return {
    type: StacksMessageType.AssetInfo,
    address: deserializeAddress(bytesReader),
    contractName: deserializeLPString(bytesReader),
    assetName: deserializeLPString(bytesReader),
  };
}

export interface LengthPrefixedList {
  readonly type: StacksMessageType.LengthPrefixedList;
  readonly lengthPrefixBytes: number;
  readonly values: StacksMessage[];
}

export function createLPList<T extends StacksMessage>(
  values: T[],
  lengthPrefixBytes?: number
): LengthPrefixedList {
  return {
    type: StacksMessageType.LengthPrefixedList,
    lengthPrefixBytes: lengthPrefixBytes || 4,
    values,
  };
}

export function serializeLPList(lpList: LengthPrefixedList): Uint8Array {
  const list = lpList.values;
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(list.length, lpList.lengthPrefixBytes)));
  for (const l of list) {
    bytesArray.push(serializeStacksMessage(l));
  }
  return concatArray(bytesArray);
}

export function deserializeLPList(
  bytesReader: BytesReader,
  type: StacksMessageType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  const length = hexToInt(bytesToHex(bytesReader.readBytes(lengthPrefixBytes || 4)));

  const l: StacksMessage[] = [];
  for (let index = 0; index < length; index++) {
    switch (type) {
      case StacksMessageType.Address:
        l.push(deserializeAddress(bytesReader));
        break;
      case StacksMessageType.LengthPrefixedString:
        l.push(deserializeLPString(bytesReader));
        break;
      case StacksMessageType.MemoString:
        l.push(deserializeMemoString(bytesReader));
        break;
      case StacksMessageType.AssetInfo:
        l.push(deserializeAssetInfo(bytesReader));
        break;
      case StacksMessageType.PostCondition:
        l.push(deserializePostCondition(bytesReader));
        break;
      case StacksMessageType.PublicKey:
        l.push(deserializePublicKey(bytesReader));
        break;
      case StacksMessageType.TransactionAuthField:
        l.push(deserializeTransactionAuthField(bytesReader));
        break;
    }
  }
  return createLPList(l, lengthPrefixBytes);
}

export function serializePostCondition(postCondition: PostCondition): Uint8Array {
  const bytesArray = [];
  bytesArray.push(postCondition.conditionType);
  bytesArray.push(serializePrincipal(postCondition.principal));

  if (
    postCondition.conditionType === PostConditionType.Fungible ||
    postCondition.conditionType === PostConditionType.NonFungible
  ) {
    bytesArray.push(serializeAssetInfo(postCondition.assetInfo));
  }

  if (postCondition.conditionType === PostConditionType.NonFungible) {
    bytesArray.push(serializeCV(postCondition.assetName));
  }

  bytesArray.push(postCondition.conditionCode);

  if (
    postCondition.conditionType === PostConditionType.STX ||
    postCondition.conditionType === PostConditionType.Fungible
  ) {
    bytesArray.push(intToBytes(postCondition.amount, false, 8));
  }

  return concatArray(bytesArray);
}

export function deserializePostCondition(bytesReader: BytesReader): PostCondition {
  const postConditionType = bytesReader.readUInt8Enum(PostConditionType, n => {
    throw new DeserializationError(`Could not read ${n} as PostConditionType`);
  });

  const principal = deserializePrincipal(bytesReader);

  let conditionCode;
  let assetInfo;
  let amount: bigint;
  switch (postConditionType) {
    case PostConditionType.STX:
      conditionCode = bytesReader.readUInt8Enum(FungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      amount = BigInt(`0x${bytesToHex(bytesReader.readBytes(8))}`);
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.STX,
        principal,
        conditionCode,
        amount,
      };
    case PostConditionType.Fungible:
      assetInfo = deserializeAssetInfo(bytesReader);
      conditionCode = bytesReader.readUInt8Enum(FungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      amount = BigInt(`0x${bytesToHex(bytesReader.readBytes(8))}`);
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.Fungible,
        principal,
        conditionCode,
        amount,
        assetInfo,
      };
    case PostConditionType.NonFungible:
      assetInfo = deserializeAssetInfo(bytesReader);
      const assetName = deserializeCV(bytesReader);
      conditionCode = bytesReader.readUInt8Enum(NonFungibleConditionCode, n => {
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
