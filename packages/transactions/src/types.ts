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
  AddressWire,
  MessageSignatureWire,
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
  StacksWireType,
} from './constants';
import { DeserializationError, SerializationError } from './errors';
import {
  PublicKeyWire,
  deserializePublicKeyBytes,
  publicKeyIsCompressed,
  serializePublicKeyBytes,
} from './keys';
import { PayloadWire, deserializePayloadBytes, serializePayloadBytes } from './payload';
import {
  AssetWire,
  ContractPrincipalWire,
  LengthPrefixedStringWire,
  PostConditionPrincipalWire,
  PostConditionWire,
  StandardPrincipalWire,
  createLPString,
} from './postcondition-types';
import {
  TransactionAuthFieldWire,
  deserializeMessageSignatureBytes,
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

/**
 * A contract identifier string given as `<address>.<contract-name>`
 */
export type ContractIdString = `${string}.${string}`;

/**
 * An asset name string given as `<contract-id>::<token-name>` aka `<contract-address>.<contract-name>::<token-name>`
 */
export type AssetString = `${ContractIdString}::${string}`;

/** @internal */
export type StacksWire =
  | AddressWire
  | PostConditionPrincipalWire
  | LengthPrefixedStringWire
  | LengthPrefixedList
  | PayloadWire
  | MemoStringWire
  | AssetWire
  | PostConditionWire
  | PublicKeyWire
  | TransactionAuthFieldWire
  | MessageSignatureWire;

/** @internal */
export function serializeStacksWire(wire: StacksWire): string {
  return bytesToHex(serializeStacksWireBytes(wire));
}
/** @internal */
export function serializeStacksWireBytes(wire: StacksWire): Uint8Array {
  switch (wire.type) {
    case StacksWireType.Address:
      return serializeAddressBytes(wire);
    case StacksWireType.Principal:
      return serializePrincipalBytes(wire);
    case StacksWireType.LengthPrefixedString:
      return serializeLPStringBytes(wire);
    case StacksWireType.MemoString:
      return serializeMemoStringBytes(wire);
    case StacksWireType.Asset:
      return serializeAssetBytes(wire);
    case StacksWireType.PostCondition:
      return serializePostConditionBytes(wire);
    case StacksWireType.PublicKey:
      return serializePublicKeyBytes(wire);
    case StacksWireType.LengthPrefixedList:
      return serializeLPListBytes(wire);
    case StacksWireType.Payload:
      return serializePayloadBytes(wire);
    case StacksWireType.TransactionAuthField:
      return serializeTransactionAuthFieldBytes(wire);
    case StacksWireType.MessageSignature:
      return serializeMessageSignatureBytes(wire);
  }
}

/** @internal */
export function deserializeStacksWireBytes(
  bytesReader: BytesReader,
  type: StacksWireType,
  listType?: StacksWireType
): StacksWire {
  switch (type) {
    case StacksWireType.Address:
      return deserializeAddressBytes(bytesReader);
    case StacksWireType.Principal:
      return deserializePrincipalBytes(bytesReader);
    case StacksWireType.LengthPrefixedString:
      return deserializeLPStringBytes(bytesReader);
    case StacksWireType.MemoString:
      return deserializeMemoStringBytes(bytesReader);
    case StacksWireType.Asset:
      return deserializeAssetBytes(bytesReader);
    case StacksWireType.PostCondition:
      return deserializePostConditionBytes(bytesReader);
    case StacksWireType.PublicKey:
      return deserializePublicKeyBytes(bytesReader);
    case StacksWireType.Payload:
      return deserializePayloadBytes(bytesReader);
    case StacksWireType.LengthPrefixedList:
      if (!listType) {
        throw new DeserializationError('No list type specified');
      }
      return deserializeLPListBytes(bytesReader, listType);
    case StacksWireType.MessageSignature:
      return deserializeMessageSignatureBytes(bytesReader);
    default:
      throw new Error('Could not recognize StacksWireType');
  }
}

export function createEmptyAddress(): AddressWire {
  return {
    type: StacksWireType.Address,
    version: AddressVersion.MainnetSingleSig,
    hash160: '0'.repeat(40),
  };
}

export function addressFromHashMode(
  hashMode: AddressHashMode,
  txVersion: TransactionVersion,
  data: string
): AddressWire {
  const version = addressHashModeToVersion(hashMode, txVersion);
  return addressFromVersionHash(version, data);
}

export function addressFromPublicKeys(
  version: AddressVersion,
  hashMode: AddressHashMode,
  numSigs: number,
  // todo: `next` refactor to `requiredSignatures`, and opts object with network?
  publicKeys: PublicKeyWire[]
): AddressWire {
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

export function serializeAddress(address: AddressWire): string {
  return bytesToHex(serializeAddressBytes(address));
}
/** @internal */
export function serializeAddressBytes(address: AddressWire): Uint8Array {
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(address.version, 1)));
  bytesArray.push(hexToBytes(address.hash160));
  return concatArray(bytesArray);
}

export function deserializeAddress(serialized: string): AddressWire {
  return deserializeAddressBytes(hexToBytes(serialized));
}
/** @internal */
export function deserializeAddressBytes(serialized: Uint8Array | BytesReader): AddressWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const version = hexToInt(bytesToHex(bytesReader.readBytes(1)));
  const data = bytesToHex(bytesReader.readBytes(20));

  return { type: StacksWireType.Address, version, hash160: data };
}

export function serializePrincipal(principal: PostConditionPrincipalWire): string {
  return bytesToHex(serializePrincipalBytes(principal));
}
/** @internal */
export function serializePrincipalBytes(principal: PostConditionPrincipalWire): Uint8Array {
  const bytesArray = [];
  bytesArray.push(principal.prefix);
  bytesArray.push(serializeAddressBytes(principal.address));
  if (principal.prefix === PostConditionPrincipalId.Contract) {
    bytesArray.push(serializeLPStringBytes(principal.contractName));
  }
  return concatArray(bytesArray);
}

export function deserializePrincipal(serialized: string): PostConditionPrincipalWire {
  return deserializePrincipalBytes(hexToBytes(serialized));
}
/** @internal */
export function deserializePrincipalBytes(
  serialized: Uint8Array | BytesReader
): PostConditionPrincipalWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const prefix = bytesReader.readUInt8Enum(PostConditionPrincipalId, n => {
    throw new DeserializationError(`Unexpected Principal payload type: ${n}`);
  });
  const address = deserializeAddressBytes(bytesReader);
  if (prefix === PostConditionPrincipalId.Standard) {
    return { type: StacksWireType.Principal, prefix, address } as StandardPrincipalWire;
  }
  const contractName = deserializeLPStringBytes(bytesReader);
  return {
    type: StacksWireType.Principal,
    prefix,
    address,
    contractName,
  } as ContractPrincipalWire;
}

export function serializeLPString(lps: LengthPrefixedStringWire): string {
  return bytesToHex(serializeLPStringBytes(lps));
}
/** @internal */
export function serializeLPStringBytes(lps: LengthPrefixedStringWire): Uint8Array {
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
): LengthPrefixedStringWire {
  return deserializeLPStringBytes(hexToBytes(serialized), prefixBytes, maxLength);
}
/** @internal */
export function deserializeLPStringBytes(
  serialized: Uint8Array | BytesReader,
  prefixBytes?: number,
  maxLength?: number
): LengthPrefixedStringWire {
  prefixBytes = prefixBytes ? prefixBytes : 1;
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const length = hexToInt(bytesToHex(bytesReader.readBytes(prefixBytes)));
  const content = bytesToUtf8(bytesReader.readBytes(length));
  return createLPString(content, prefixBytes, maxLength ?? 128);
}

export function codeBodyString(content: string): LengthPrefixedStringWire {
  return createLPString(content, 4, 100_000);
}

export interface MemoStringWire {
  readonly type: StacksWireType.MemoString;
  readonly content: string;
}

export function createMemoString(content: string): MemoStringWire {
  if (content && exceedsMaxLengthBytes(content, MEMO_MAX_LENGTH_BYTES)) {
    throw new Error(`Memo exceeds maximum length of ${MEMO_MAX_LENGTH_BYTES} bytes`);
  }
  return { type: StacksWireType.MemoString, content };
}

export function serializeMemoString(memoString: MemoStringWire): string {
  return bytesToHex(serializeMemoStringBytes(memoString));
}
/** @internal */
export function serializeMemoStringBytes(memoString: MemoStringWire): Uint8Array {
  const bytesArray = [];
  const contentBytes = utf8ToBytes(memoString.content);
  const paddedContent = rightPadHexToLength(bytesToHex(contentBytes), MEMO_MAX_LENGTH_BYTES * 2);
  bytesArray.push(hexToBytes(paddedContent));
  return concatArray(bytesArray);
}

export function deserializeMemoString(serialized: string): MemoStringWire {
  return deserializeMemoStringBytes(hexToBytes(serialized));
}
/** @internal */
export function deserializeMemoStringBytes(serialized: Uint8Array | BytesReader): MemoStringWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  let content = bytesToUtf8(bytesReader.readBytes(MEMO_MAX_LENGTH_BYTES));
  content = content.replace(/\u0000*$/, ''); // remove all trailing unicode null characters
  return { type: StacksWireType.MemoString, content };
}

export function serializeAsset(info: AssetWire): string {
  return bytesToHex(serializeAssetBytes(info));
}
/** @internal */
export function serializeAssetBytes(info: AssetWire): Uint8Array {
  const bytesArray = [];
  bytesArray.push(serializeAddressBytes(info.address));
  bytesArray.push(serializeLPStringBytes(info.contractName));
  bytesArray.push(serializeLPStringBytes(info.assetName));
  return concatArray(bytesArray);
}

export function deserializeAsset(serialized: string): AssetWire {
  return deserializeAssetBytes(hexToBytes(serialized));
}
/** @internal */
export function deserializeAssetBytes(serialized: Uint8Array | BytesReader): AssetWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  return {
    type: StacksWireType.Asset,
    address: deserializeAddressBytes(bytesReader),
    contractName: deserializeLPStringBytes(bytesReader),
    assetName: deserializeLPStringBytes(bytesReader),
  };
}

export interface LengthPrefixedList {
  readonly type: StacksWireType.LengthPrefixedList;
  readonly lengthPrefixBytes: number;
  readonly values: StacksWire[];
}

export function createLPList<T extends StacksWire>(
  values: T[],
  lengthPrefixBytes?: number
): LengthPrefixedList {
  return {
    type: StacksWireType.LengthPrefixedList,
    lengthPrefixBytes: lengthPrefixBytes || 4,
    values,
  };
}

export function serializeLPList(lpList: LengthPrefixedList): string {
  return bytesToHex(serializeLPListBytes(lpList));
}
/** @internal */
export function serializeLPListBytes(lpList: LengthPrefixedList): Uint8Array {
  const list = lpList.values;
  const bytesArray = [];
  bytesArray.push(hexToBytes(intToHex(list.length, lpList.lengthPrefixBytes)));
  for (const l of list) {
    bytesArray.push(serializeStacksWireBytes(l));
  }
  return concatArray(bytesArray);
}

// todo: `next` refactor for inversion of control
export function deserializeLPList(
  serialized: string,
  type: StacksWireType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  return deserializeLPListBytes(hexToBytes(serialized), type, lengthPrefixBytes);
}
/** @internal */
export function deserializeLPListBytes(
  serialized: Uint8Array | BytesReader,
  type: StacksWireType,
  lengthPrefixBytes?: number
): LengthPrefixedList {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const length = hexToInt(bytesToHex(bytesReader.readBytes(lengthPrefixBytes || 4)));

  const l: StacksWire[] = [];
  for (let index = 0; index < length; index++) {
    switch (type) {
      case StacksWireType.Address:
        l.push(deserializeAddressBytes(bytesReader));
        break;
      case StacksWireType.LengthPrefixedString:
        l.push(deserializeLPStringBytes(bytesReader));
        break;
      case StacksWireType.MemoString:
        l.push(deserializeMemoStringBytes(bytesReader));
        break;
      case StacksWireType.Asset:
        l.push(deserializeAssetBytes(bytesReader));
        break;
      case StacksWireType.PostCondition:
        l.push(deserializePostConditionBytes(bytesReader));
        break;
      case StacksWireType.PublicKey:
        l.push(deserializePublicKeyBytes(bytesReader));
        break;
      case StacksWireType.TransactionAuthField:
        l.push(deserializeTransactionAuthFieldBytes(bytesReader));
        break;
    }
  }
  return createLPList(l, lengthPrefixBytes);
}

export function serializePostCondition(postCondition: PostConditionWire): string {
  return bytesToHex(serializePostConditionBytes(postCondition));
}
/** @internal */
export function serializePostConditionBytes(postCondition: PostConditionWire): Uint8Array {
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

export function deserializePostCondition(serialized: string): PostConditionWire {
  return deserializePostConditionBytes(hexToBytes(serialized));
}
/** @internal */
export function deserializePostConditionBytes(
  serialized: Uint8Array | BytesReader
): PostConditionWire {
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
        type: StacksWireType.PostCondition,
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
        type: StacksWireType.PostCondition,
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
        type: StacksWireType.PostCondition,
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
