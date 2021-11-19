import { Buffer, intToBytes } from '@stacks/common';
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
  BufferArray,
  intToHexString,
  hexStringToInt,
  exceedsMaxLengthBytes,
  hashP2PKH,
  rightPadHexToLength,
  hashP2SH,
  hashP2WSH,
  hashP2WPKH,
} from './utils';

import { BufferReader } from './bufferReader';
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

export function serializeStacksMessage(message: StacksMessage): Buffer {
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
  bufferReader: BufferReader,
  type: StacksMessageType,
  listType?: StacksMessageType
): StacksMessage {
  switch (type) {
    case StacksMessageType.Address:
      return deserializeAddress(bufferReader);
    case StacksMessageType.Principal:
      return deserializePrincipal(bufferReader);
    case StacksMessageType.LengthPrefixedString:
      return deserializeLPString(bufferReader);
    case StacksMessageType.MemoString:
      return deserializeMemoString(bufferReader);
    case StacksMessageType.AssetInfo:
      return deserializeAssetInfo(bufferReader);
    case StacksMessageType.PostCondition:
      return deserializePostCondition(bufferReader);
    case StacksMessageType.PublicKey:
      return deserializePublicKey(bufferReader);
    case StacksMessageType.Payload:
      return deserializePayload(bufferReader);
    case StacksMessageType.LengthPrefixedList:
      if (!listType) {
        throw new DeserializationError('No List Type specified');
      }
      return deserializeLPList(bufferReader, listType);
    case StacksMessageType.MessageSignature:
      return deserializeMessageSignature(bufferReader);
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

export function serializeAddress(address: Address): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendHexString(intToHexString(address.version, 1));
  bufferArray.appendHexString(address.hash160);

  return bufferArray.concatBuffer();
}

export function deserializeAddress(bufferReader: BufferReader): Address {
  const version = hexStringToInt(bufferReader.readBuffer(1).toString('hex'));
  const data = bufferReader.readBuffer(20).toString('hex');

  return { type: StacksMessageType.Address, version, hash160: data };
}

export function serializePrincipal(principal: PostConditionPrincipal): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.push(Buffer.from([principal.prefix]));
  bufferArray.push(serializeAddress(principal.address));
  if (principal.prefix === PostConditionPrincipalID.Contract) {
    bufferArray.push(serializeLPString(principal.contractName));
  }
  return bufferArray.concatBuffer();
}

export function deserializePrincipal(bufferReader: BufferReader): PostConditionPrincipal {
  const prefix = bufferReader.readUInt8Enum(PostConditionPrincipalID, _ => {
    throw new DeserializationError('Unexpected Principal payload type: ${n}');
  });
  const address = deserializeAddress(bufferReader);
  if (prefix === PostConditionPrincipalID.Standard) {
    return { type: StacksMessageType.Principal, prefix, address } as StandardPrincipal;
  }
  const contractName = deserializeLPString(bufferReader);
  return {
    type: StacksMessageType.Principal,
    prefix,
    address,
    contractName,
  } as ContractPrincipal;
}

export function serializeLPString(lps: LengthPrefixedString) {
  const bufferArray: BufferArray = new BufferArray();
  const contentBuffer = Buffer.from(lps.content);
  const length = contentBuffer.byteLength;
  bufferArray.appendHexString(intToHexString(length, lps.lengthPrefixBytes));
  bufferArray.push(contentBuffer);
  return bufferArray.concatBuffer();
}

export function deserializeLPString(
  bufferReader: BufferReader,
  prefixBytes?: number,
  maxLength?: number
): LengthPrefixedString {
  prefixBytes = prefixBytes ? prefixBytes : 1;
  const length = hexStringToInt(bufferReader.readBuffer(prefixBytes).toString('hex'));
  const content = bufferReader.readBuffer(length).toString();
  return createLPString(content, prefixBytes, maxLength ?? 128);
}

export function codeBodyString(content: string): LengthPrefixedString {
  return createLPString(content, 4, 100000);
}

export interface MemoString {
  readonly type: StacksMessageType.MemoString;
  readonly content: string;
}

export function createMemoString(content: string): MemoString {
  if (content && exceedsMaxLengthBytes(content, MEMO_MAX_LENGTH_BYTES)) {
    throw new Error(`Memo exceeds maximum length of ${MEMO_MAX_LENGTH_BYTES.toString()} bytes`);
  }
  return { type: StacksMessageType.MemoString, content };
}

export function serializeMemoString(memoString: MemoString): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  const contentBuffer = Buffer.from(memoString.content);
  const paddedContent = rightPadHexToLength(
    contentBuffer.toString('hex'),
    MEMO_MAX_LENGTH_BYTES * 2
  );
  bufferArray.push(Buffer.from(paddedContent, 'hex'));
  return bufferArray.concatBuffer();
}

export function deserializeMemoString(bufferReader: BufferReader): MemoString {
  const content = bufferReader.readBuffer(MEMO_MAX_LENGTH_BYTES).toString();
  return { type: StacksMessageType.MemoString, content };
}

export function serializeAssetInfo(info: AssetInfo): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.push(serializeAddress(info.address));
  bufferArray.push(serializeLPString(info.contractName));
  bufferArray.push(serializeLPString(info.assetName));
  return bufferArray.concatBuffer();
}

export function deserializeAssetInfo(bufferReader: BufferReader): AssetInfo {
  return {
    type: StacksMessageType.AssetInfo,
    address: deserializeAddress(bufferReader),
    contractName: deserializeLPString(bufferReader),
    assetName: deserializeLPString(bufferReader),
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

export function serializeLPList(lpList: LengthPrefixedList): Buffer {
  const list = lpList.values;
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendHexString(intToHexString(list.length, lpList.lengthPrefixBytes));
  for (let index = 0; index < list.length; index++) {
    bufferArray.push(serializeStacksMessage(list[index]));
  }
  return bufferArray.concatBuffer();
}

export function deserializeLPList(
  bufferReader: BufferReader,
  type: StacksMessageType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  const length = hexStringToInt(bufferReader.readBuffer(lengthPrefixBytes || 4).toString('hex'));
  const l: StacksMessage[] = [];
  for (let index = 0; index < length; index++) {
    switch (type) {
      case StacksMessageType.Address:
        l.push(deserializeAddress(bufferReader));
        break;
      case StacksMessageType.LengthPrefixedString:
        l.push(deserializeLPString(bufferReader));
        break;
      case StacksMessageType.MemoString:
        l.push(deserializeMemoString(bufferReader));
        break;
      case StacksMessageType.AssetInfo:
        l.push(deserializeAssetInfo(bufferReader));
        break;
      case StacksMessageType.PostCondition:
        l.push(deserializePostCondition(bufferReader));
        break;
      case StacksMessageType.PublicKey:
        l.push(deserializePublicKey(bufferReader));
        break;
      case StacksMessageType.TransactionAuthField:
        l.push(deserializeTransactionAuthField(bufferReader));
        break;
    }
  }
  return createLPList(l, lengthPrefixBytes);
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
    bufferArray.push(intToBytes(postCondition.amount, false, 8));
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
  let amount: bigint;
  switch (postConditionType) {
    case PostConditionType.STX:
      conditionCode = bufferReader.readUInt8Enum(FungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      amount = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));
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
      amount = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));
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
