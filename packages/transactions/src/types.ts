import {
  bytesToHex,
  bytesToUtf8,
  concatArray,
  hexToBytes,
  hexToInt,
  intToBytes,
  intToHex,
  isInstance,
  utf8ToBytes,
} from '@stacks/common';
import { StacksNetwork, StacksNetworkName, TransactionVersion } from '@stacks/network';
import { BytesReader } from './bytesReader';
import { ClarityValue, deserializeCV, serializeCVBytes } from './clarity';
import {
  Address,
  MessageSignature,
  addressFromVersionHash,
  addressHashModeToVersion,
} from './common';
import {
  AddressHashMode,
  AddressVersion,
  FungibleConditionCode,
  MEMO_MAX_LENGTH_BYTES,
  NonFungibleConditionCode,
  PostConditionPrincipalId,
  PostConditionType,
  StacksMessageType,
} from './constants';
import { DeserializationError, SerializationError } from './errors';
import {
  StacksPublicKey,
  deserializePublicKeyBytes,
  publicKeyIsCompressed,
  serializePublicKeyBytes,
} from './keys';
import { Payload, deserializePayloadBytes, serializePayloadBytes } from './payload';
import {
  Asset,
  ContractPrincipal,
  LengthPrefixedString,
  PostCondition,
  PostConditionPrincipal,
  StandardPrincipal,
  createLPString,
} from './postcondition-types';
import {
  TransactionAuthField,
  deserializeMessageSignature,
  deserializeTransactionAuthFieldBytes,
  serializeMessageSignatureBytes,
  serializeTransactionAuthFieldBytes,
} from './signature';
import {
  exceedsMaxLengthBytes,
  hashP2PKH,
  hashP2SH,
  hashP2WPKH,
  hashP2WSH,
  rightPadHexToLength,
} from './utils';

/**
 * An address string encoded as c32check
 */
export type AddressString = string;

export type StacksMessage =
  | Address
  | PostConditionPrincipal
  | LengthPrefixedString
  | LengthPrefixedList
  | Payload
  | MemoString
  | Asset
  | PostCondition
  | StacksPublicKey
  | TransactionAuthField
  | MessageSignature;

export function serializeStacksMessage(message: StacksMessage): string {
  return bytesToHex(serializeStacksMessageBytes(message));
}
/** @ignore */
export function serializeStacksMessageBytes(message: StacksMessage): Uint8Array {
  switch (message.type) {
    case StacksMessageType.Address:
      return serializeAddressBytes(message);
    case StacksMessageType.Principal:
      return serializePrincipalBytes(message);
    case StacksMessageType.LengthPrefixedString:
      return serializeLPStringBytes(message);
    case StacksMessageType.MemoString:
      return serializeMemoStringBytes(message);
    case StacksMessageType.Asset:
      return serializeAssetBytes(message);
    case StacksMessageType.PostCondition:
      return serializePostConditionBytes(message);
    case StacksMessageType.PublicKey:
      return serializePublicKeyBytes(message);
    case StacksMessageType.LengthPrefixedList:
      return serializeLPListBytes(message);
    case StacksMessageType.Payload:
      return serializePayloadBytes(message);
    case StacksMessageType.TransactionAuthField:
      return serializeTransactionAuthFieldBytes(message);
    case StacksMessageType.MessageSignature:
      return serializeMessageSignatureBytes(message);
  }
}

export function deserializeStacksMessage(
  bytesReader: BytesReader,
  type: StacksMessageType,
  listType?: StacksMessageType
): StacksMessage {
  switch (type) {
    case StacksMessageType.Address:
      return deserializeAddressBytes(bytesReader);
    case StacksMessageType.Principal:
      return deserializePrincipalBytes(bytesReader);
    case StacksMessageType.LengthPrefixedString:
      return deserializeLPStringBytes(bytesReader);
    case StacksMessageType.MemoString:
      return deserializeMemoStringBytes(bytesReader);
    case StacksMessageType.Asset:
      return deserializeAssetBytes(bytesReader);
    case StacksMessageType.PostCondition:
      return deserializePostConditionBytes(bytesReader);
    case StacksMessageType.PublicKey:
      return deserializePublicKeyBytes(bytesReader);
    case StacksMessageType.Payload:
      return deserializePayloadBytes(bytesReader);
    case StacksMessageType.LengthPrefixedList:
      if (!listType) {
        throw new DeserializationError('No List Type specified');
      }
      return deserializeLPListBytes(bytesReader, listType);
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
  // todo: `next` refactor to `requiredSignatures`, and opts object
  if (publicKeys.length === 0) {
    throw Error('Invalid number of public keys');
  }

  if (hashMode === AddressHashMode.SerializeP2PKH || hashMode === AddressHashMode.SerializeP2WPKH) {
    if (publicKeys.length !== 1 || numSigs !== 1) {
      throw Error('Invalid number of public keys or signatures');
    }
  }

  if (
    hashMode === AddressHashMode.SerializeP2WPKH ||
    hashMode === AddressHashMode.SerializeP2WSH ||
    hashMode === AddressHashMode.SerializeP2WSHNonSequential
  ) {
    if (!publicKeys.map(p => p.data).every(publicKeyIsCompressed)) {
      throw Error('Public keys must be compressed for segwit');
    }
  }

  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      return addressFromVersionHash(version, hashP2PKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2WPKH:
      return addressFromVersionHash(version, hashP2WPKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2SH:
    case AddressHashMode.SerializeP2SHNonSequential:
      return addressFromVersionHash(
        version,
        hashP2SH(numSigs, publicKeys.map(serializePublicKeyBytes))
      );
    case AddressHashMode.SerializeP2WSH:
    case AddressHashMode.SerializeP2WSHNonSequential:
      return addressFromVersionHash(
        version,
        hashP2WSH(numSigs, publicKeys.map(serializePublicKeyBytes))
      );
  }
}

export function serializeAddress(address: Address): string {
  return bytesToHex(serializeAddressBytes(address));
}
/** @ignore */
export function serializeAddressBytes(address: Address): Uint8Array {
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(address.version, 1)));
  bytesArray.push(hexToBytes(address.hash160));
  return concatArray(bytesArray);
}

export function deserializeAddress(serialized: string): Address {
  return deserializeAddressBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeAddressBytes(serialized: Uint8Array | BytesReader): Address {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const version = hexToInt(bytesToHex(bytesReader.readBytes(1)));
  const data = bytesToHex(bytesReader.readBytes(20));

  return { type: StacksMessageType.Address, version, hash160: data };
}

export function serializePrincipal(principal: PostConditionPrincipal): string {
  return bytesToHex(serializePrincipalBytes(principal));
}
/** @ignore */
export function serializePrincipalBytes(principal: PostConditionPrincipal): Uint8Array {
  const bytesArray = [];
  bytesArray.push(principal.prefix);
  bytesArray.push(serializeAddressBytes(principal.address));
  if (principal.prefix === PostConditionPrincipalId.Contract) {
    bytesArray.push(serializeLPStringBytes(principal.contractName));
  }
  return concatArray(bytesArray);
}

export function deserializePrincipal(serialized: string): PostConditionPrincipal {
  return deserializePrincipalBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePrincipalBytes(
  serialized: Uint8Array | BytesReader
): PostConditionPrincipal {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const prefix = bytesReader.readUInt8Enum(PostConditionPrincipalId, n => {
    throw new DeserializationError(`Unexpected Principal payload type: ${n}`);
  });
  const address = deserializeAddressBytes(bytesReader);
  if (prefix === PostConditionPrincipalId.Standard) {
    return { type: StacksMessageType.Principal, prefix, address } as StandardPrincipal;
  }
  const contractName = deserializeLPStringBytes(bytesReader);
  return {
    type: StacksMessageType.Principal,
    prefix,
    address,
    contractName,
  } as ContractPrincipal;
}

export function serializeLPString(lps: LengthPrefixedString): string {
  return bytesToHex(serializeLPStringBytes(lps));
}
/** @ignore */
export function serializeLPStringBytes(lps: LengthPrefixedString): Uint8Array {
  const bytesArray = [];
  const contentBytes = utf8ToBytes(lps.content);
  const length = contentBytes.byteLength;
  bytesArray.push(hexToBytes(intToHex(length, lps.lengthPrefixBytes)));
  bytesArray.push(contentBytes);
  return concatArray(bytesArray);
}

export function deserializeLPString(
  serialized: string,
  prefixBytes?: number,
  maxLength?: number
): LengthPrefixedString {
  return deserializeLPStringBytes(hexToBytes(serialized), prefixBytes, maxLength);
}
/** @ignore */
export function deserializeLPStringBytes(
  serialized: Uint8Array | BytesReader,
  prefixBytes?: number,
  maxLength?: number
): LengthPrefixedString {
  prefixBytes = prefixBytes ? prefixBytes : 1;
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
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

export function serializeMemoString(memoString: MemoString): string {
  return bytesToHex(serializeMemoStringBytes(memoString));
}
/** @ignore */
export function serializeMemoStringBytes(memoString: MemoString): Uint8Array {
  const bytesArray = [];
  const contentBytes = utf8ToBytes(memoString.content);
  const paddedContent = rightPadHexToLength(bytesToHex(contentBytes), MEMO_MAX_LENGTH_BYTES * 2);
  bytesArray.push(hexToBytes(paddedContent));
  return concatArray(bytesArray);
}

export function deserializeMemoString(serialized: string): MemoString {
  return deserializeMemoStringBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeMemoStringBytes(serialized: Uint8Array | BytesReader): MemoString {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  let content = bytesToUtf8(bytesReader.readBytes(MEMO_MAX_LENGTH_BYTES));
  content = content.replace(/\u0000*$/, ''); // remove all trailing unicode null characters
  return { type: StacksMessageType.MemoString, content };
}

export function serializeAsset(info: Asset): string {
  return bytesToHex(serializeAssetBytes(info));
}
/** @ignore */
export function serializeAssetBytes(info: Asset): Uint8Array {
  const bytesArray = [];
  bytesArray.push(serializeAddressBytes(info.address));
  bytesArray.push(serializeLPStringBytes(info.contractName));
  bytesArray.push(serializeLPStringBytes(info.assetName));
  return concatArray(bytesArray);
}

export function deserializeAsset(serialized: string): Asset {
  return deserializeAssetBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeAssetBytes(serialized: Uint8Array | BytesReader): Asset {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  return {
    type: StacksMessageType.Asset,
    address: deserializeAddressBytes(bytesReader),
    contractName: deserializeLPStringBytes(bytesReader),
    assetName: deserializeLPStringBytes(bytesReader),
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

export function serializeLPList(lpList: LengthPrefixedList): string {
  return bytesToHex(serializeLPListBytes(lpList));
}
/** @ignore */
export function serializeLPListBytes(lpList: LengthPrefixedList): Uint8Array {
  const list = lpList.values;
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(list.length, lpList.lengthPrefixBytes)));
  for (const l of list) {
    bytesArray.push(serializeStacksMessageBytes(l));
  }
  return concatArray(bytesArray);
}

// todo: `next` refactor for inversion of control
export function deserializeLPList(
  serialized: string,
  type: StacksMessageType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  return deserializeLPListBytes(hexToBytes(serialized), type, lengthPrefixBytes);
}
/** @ignore */
export function deserializeLPListBytes(
  serialized: Uint8Array | BytesReader,
  type: StacksMessageType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const length = hexToInt(bytesToHex(bytesReader.readBytes(lengthPrefixBytes || 4)));

  const l: StacksMessage[] = [];
  for (let index = 0; index < length; index++) {
    switch (type) {
      case StacksMessageType.Address:
        l.push(deserializeAddressBytes(bytesReader));
        break;
      case StacksMessageType.LengthPrefixedString:
        l.push(deserializeLPStringBytes(bytesReader));
        break;
      case StacksMessageType.MemoString:
        l.push(deserializeMemoStringBytes(bytesReader));
        break;
      case StacksMessageType.Asset:
        l.push(deserializeAssetBytes(bytesReader));
        break;
      case StacksMessageType.PostCondition:
        l.push(deserializePostConditionBytes(bytesReader));
        break;
      case StacksMessageType.PublicKey:
        l.push(deserializePublicKeyBytes(bytesReader));
        break;
      case StacksMessageType.TransactionAuthField:
        l.push(deserializeTransactionAuthFieldBytes(bytesReader));
        break;
    }
  }
  return createLPList(l, lengthPrefixBytes);
}

export function serializePostCondition(postCondition: PostCondition): string {
  return bytesToHex(serializePostConditionBytes(postCondition));
}
/** @ignore */
export function serializePostConditionBytes(postCondition: PostCondition): Uint8Array {
  const bytesArray = [];
  bytesArray.push(postCondition.conditionType);
  bytesArray.push(serializePrincipalBytes(postCondition.principal));

  if (
    postCondition.conditionType === PostConditionType.Fungible ||
    postCondition.conditionType === PostConditionType.NonFungible
  ) {
    bytesArray.push(serializeAssetBytes(postCondition.asset));
  }

  if (postCondition.conditionType === PostConditionType.NonFungible) {
    bytesArray.push(serializeCVBytes(postCondition.assetName));
  }

  bytesArray.push(postCondition.conditionCode);

  if (
    postCondition.conditionType === PostConditionType.STX ||
    postCondition.conditionType === PostConditionType.Fungible
  ) {
    // SIP-005: Maximal length of amount is 8 bytes
    if (postCondition.amount > BigInt('0xffffffffffffffff'))
      throw new SerializationError('The post-condition amount may not be larger than 8 bytes');
    bytesArray.push(intToBytes(postCondition.amount, false, 8));
  }

  return concatArray(bytesArray);
}

export function deserializePostCondition(serialized: string): PostCondition {
  return deserializePostConditionBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePostConditionBytes(serialized: Uint8Array | BytesReader): PostCondition {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const postConditionType = bytesReader.readUInt8Enum(PostConditionType, n => {
    throw new DeserializationError(`Could not read ${n} as PostConditionType`);
  });

  const principal = deserializePrincipalBytes(bytesReader);

  let conditionCode;
  let asset;
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
      asset = deserializeAssetBytes(bytesReader);
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
        asset: asset,
      };
    case PostConditionType.NonFungible:
      asset = deserializeAssetBytes(bytesReader);
      const assetName = deserializeCV(bytesReader);
      conditionCode = bytesReader.readUInt8Enum(NonFungibleConditionCode, n => {
        throw new DeserializationError(`Could not read ${n} as FungibleConditionCode`);
      });
      return {
        type: StacksMessageType.PostCondition,
        conditionType: PostConditionType.NonFungible,
        principal,
        conditionCode,
        asset: asset,
        assetName,
      };
  }
}

export type BaseRejection = {
  error: string;
  reason: string;
  txid: string;
};

export type SerializationRejection = {
  reason: 'Serialization';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type DeserializationRejection = {
  reason: 'Deserialization';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type SignatureValidationRejection = {
  reason: 'SignatureValidation';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type BadNonceRejection = {
  reason: 'BadNonce';
  reason_data: {
    expected: number;
    actual: number;
    is_origin: boolean;
    principal: boolean;
  };
} & BaseRejection;

export type FeeTooLowRejection = {
  reason: 'FeeTooLow';
  reason_data: {
    expected: number;
    actual: number;
  };
} & BaseRejection;

export type NotEnoughFundsRejection = {
  reason: 'NotEnoughFunds';
  reason_data: {
    expected: string;
    actual: string;
  };
} & BaseRejection;

export type NoSuchContractRejection = {
  reason: 'NoSuchContract';
} & BaseRejection;

export type NoSuchPublicFunctionRejection = {
  reason: 'NoSuchPublicFunction';
} & BaseRejection;

export type BadFunctionArgumentRejection = {
  reason: 'BadFunctionArgument';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type ContractAlreadyExistsRejection = {
  reason: 'ContractAlreadyExists';
  reason_data: {
    contract_identifier: string;
  };
} & BaseRejection;

export type PoisonMicroblocksDoNotConflictRejection = {
  reason: 'PoisonMicroblocksDoNotConflict';
} & BaseRejection;

export type PoisonMicroblockHasUnknownPubKeyHashRejection = {
  reason: 'PoisonMicroblockHasUnknownPubKeyHash';
} & BaseRejection;

export type PoisonMicroblockIsInvalidRejection = {
  reason: 'PoisonMicroblockIsInvalid';
} & BaseRejection;

export type BadAddressVersionByteRejection = {
  reason: 'BadAddressVersionByte';
} & BaseRejection;

export type NoCoinbaseViaMempoolRejection = {
  reason: 'NoCoinbaseViaMempool';
} & BaseRejection;

export type ServerFailureNoSuchChainTipRejection = {
  reason: 'ServerFailureNoSuchChainTip';
} & BaseRejection;

export type ServerFailureDatabaseRejection = {
  reason: 'ServerFailureDatabase';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type ServerFailureOtherRejection = {
  reason: 'ServerFailureOther';
  reason_data: {
    message: string;
  };
} & BaseRejection;

export type TxBroadcastResultOk = {
  txid: string;
};

export type TxBroadcastResultRejected =
  | SerializationRejection
  | DeserializationRejection
  | SignatureValidationRejection
  | BadNonceRejection
  | FeeTooLowRejection
  | NotEnoughFundsRejection
  | NoSuchContractRejection
  | NoSuchPublicFunctionRejection
  | BadFunctionArgumentRejection
  | ContractAlreadyExistsRejection
  | PoisonMicroblocksDoNotConflictRejection
  | PoisonMicroblockHasUnknownPubKeyHashRejection
  | PoisonMicroblockIsInvalidRejection
  | BadAddressVersionByteRejection
  | NoCoinbaseViaMempoolRejection
  | ServerFailureNoSuchChainTipRejection
  | ServerFailureDatabaseRejection
  | ServerFailureOtherRejection;

export type TxBroadcastResult = TxBroadcastResultOk | TxBroadcastResultRejected;

export interface FeeEstimation {
  fee: number;
  fee_rate: number;
}

export interface FeeEstimateResponse {
  cost_scalar_change_by_byte: bigint;
  estimated_cost: {
    read_count: bigint;
    read_length: bigint;
    runtime: bigint;
    write_count: bigint;
    write_length: bigint;
  };
  estimated_cost_scalar: bigint;
  estimations: [FeeEstimation, FeeEstimation, FeeEstimation];
}

/**
 * Read only function options
 *
 * @param {String} contractAddress - the c32check address of the contract
 * @param {String} contractName - the contract name
 * @param {String} functionName - name of the function to be called
 * @param {[ClarityValue]} functionArgs - an array of Clarity values as arguments to the function call
 * @param {StacksNetwork} network - the Stacks blockchain network this transaction is destined for
 * @param {String} senderAddress - the c32check address of the sender
 */
export interface ReadOnlyFunctionOptions {
  contractName: string;
  contractAddress: string;
  functionName: string;
  functionArgs: ClarityValue[];
  /** the network that the contract which contains the function is deployed to */
  network?: StacksNetworkName | StacksNetwork;
  /** address of the sender */
  senderAddress: string;
}
