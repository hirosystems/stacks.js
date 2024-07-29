import {
  bytesToHex,
  bytesToUtf8,
  concatArray,
  hexToBytes,
  hexToInt,
  intToBigInt,
  intToBytes,
  intToHex,
  isInstance,
  utf8ToBytes,
  writeUInt32BE,
  writeUInt8,
} from '@stacks/common';
import { BytesReader } from '../BytesReader';
import {
  ClarityValue,
  OptionalCV,
  PrincipalCV,
  deserializeCV,
  noneCV,
  serializeCVBytes,
  someCV,
} from '../clarity';
import {
  AuthFieldType,
  COINBASE_BYTES_LENGTH,
  COMPRESSED_PUBKEY_LENGTH_BYTES,
  ClarityVersion,
  FungibleConditionCode,
  MEMO_MAX_LENGTH_BYTES,
  NonFungibleConditionCode,
  PayloadType,
  PostConditionPrincipalId,
  PostConditionType,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  TenureChangeCause,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
  VRF_PROOF_BYTES_LENGTH,
} from '../constants';
import { DeserializationError, SerializationError } from '../errors';
import { compressPublicKey, createStacksPublicKey, uncompressPublicKey } from '../keys';
import { rightPadHexToLength } from '../utils';
import {
  createCoinbasePayload,
  createContractCallPayload,
  createLPList,
  createLPString,
  createMessageSignature,
  createNakamotoCoinbasePayload,
  createPoisonPayload,
  createSmartContractPayload,
  createTenureChangePayload,
  createTokenTransferPayload,
  createTransactionAuthField,
} from './create';
import {
  AddressWire,
  AssetWire,
  ContractPrincipalWire,
  LengthPrefixedList,
  LengthPrefixedStringWire,
  MemoStringWire,
  MessageSignatureWire,
  OriginPrincipalWire,
  PayloadInput,
  PayloadWire,
  PostConditionPrincipalWire,
  PostConditionWire,
  PublicKeyWire,
  StacksWire,
  StacksWireType,
  StandardPrincipalWire,
  TransactionAuthFieldWire,
} from './types';

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
  if (
    principal.prefix === PostConditionPrincipalId.Standard ||
    principal.prefix === PostConditionPrincipalId.Contract
  ) {
    bytesArray.push(serializeAddressBytes(principal.address));
  }
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
  if (prefix === PostConditionPrincipalId.Origin) {
    return { type: StacksWireType.Principal, prefix } as OriginPrincipalWire;
  }
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

export function serializePayload(payload: PayloadInput): string {
  return bytesToHex(serializePayloadBytes(payload));
}
/** @ignore */
export function serializePayloadBytes(payload: PayloadInput): Uint8Array {
  const bytesArray = [];
  bytesArray.push(payload.payloadType);

  switch (payload.payloadType) {
    case PayloadType.TokenTransfer:
      bytesArray.push(serializeCVBytes(payload.recipient));
      bytesArray.push(intToBytes(payload.amount, false, 8));
      bytesArray.push(serializeStacksWireBytes(payload.memo));
      break;
    case PayloadType.ContractCall:
      bytesArray.push(serializeStacksWireBytes(payload.contractAddress));
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.functionName));
      const numArgs = new Uint8Array(4);
      writeUInt32BE(numArgs, payload.functionArgs.length, 0);
      bytesArray.push(numArgs);
      payload.functionArgs.forEach(arg => {
        bytesArray.push(serializeCVBytes(arg));
      });
      break;
    case PayloadType.SmartContract:
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.codeBody));
      break;
    case PayloadType.VersionedSmartContract:
      bytesArray.push(payload.clarityVersion);
      bytesArray.push(serializeStacksWireBytes(payload.contractName));
      bytesArray.push(serializeStacksWireBytes(payload.codeBody));
      break;
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      break;
    case PayloadType.Coinbase:
      bytesArray.push(payload.coinbaseBytes);
      break;
    case PayloadType.CoinbaseToAltRecipient:
      bytesArray.push(payload.coinbaseBytes);
      bytesArray.push(serializeCVBytes(payload.recipient));
      break;
    case PayloadType.NakamotoCoinbase:
      bytesArray.push(payload.coinbaseBytes);
      bytesArray.push(serializeCVBytes(payload.recipient ? someCV(payload.recipient) : noneCV()));
      bytesArray.push(payload.vrfProof);
      break;
    case PayloadType.TenureChange:
      bytesArray.push(hexToBytes(payload.tenureHash));
      bytesArray.push(hexToBytes(payload.previousTenureHash));
      bytesArray.push(hexToBytes(payload.burnViewHash));
      bytesArray.push(hexToBytes(payload.previousTenureEnd));
      bytesArray.push(writeUInt32BE(new Uint8Array(4), payload.previousTenureBlocks));
      bytesArray.push(writeUInt8(new Uint8Array(1), payload.cause));
      bytesArray.push(hexToBytes(payload.publicKeyHash));
      break;
  }

  return concatArray(bytesArray);
}

export function deserializePayload(serialized: string): PayloadWire {
  return deserializePayloadBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePayloadBytes(serialized: Uint8Array | BytesReader): PayloadWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const payloadType = bytesReader.readUInt8Enum(PayloadType, n => {
    throw new Error(`Cannot recognize PayloadType: ${n}`);
  });

  switch (payloadType) {
    case PayloadType.TokenTransfer:
      const recipient = deserializeCV(bytesReader) as PrincipalCV;
      const amount = intToBigInt(bytesReader.readBytes(8), false);
      const memo = deserializeMemoStringBytes(bytesReader);
      return createTokenTransferPayload(recipient, amount, memo);
    case PayloadType.ContractCall:
      const contractAddress = deserializeAddressBytes(bytesReader);
      const contractCallName = deserializeLPStringBytes(bytesReader);
      const functionName = deserializeLPStringBytes(bytesReader);
      const functionArgs: ClarityValue[] = [];
      const numberOfArgs = bytesReader.readUInt32BE();
      for (let i = 0; i < numberOfArgs; i++) {
        const clarityValue = deserializeCV(bytesReader);
        functionArgs.push(clarityValue);
      }
      return createContractCallPayload(
        contractAddress,
        contractCallName,
        functionName,
        functionArgs
      );
    case PayloadType.SmartContract:
      const smartContractName = deserializeLPStringBytes(bytesReader);
      const codeBody = deserializeLPStringBytes(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody);

    case PayloadType.VersionedSmartContract: {
      const clarityVersion = bytesReader.readUInt8Enum(ClarityVersion, n => {
        throw new Error(`Cannot recognize ClarityVersion: ${n}`);
      });
      const smartContractName = deserializeLPStringBytes(bytesReader);
      const codeBody = deserializeLPStringBytes(bytesReader, 4, 100_000);
      return createSmartContractPayload(smartContractName, codeBody, clarityVersion);
    }
    case PayloadType.PoisonMicroblock:
      // TODO: implement
      return createPoisonPayload();
    case PayloadType.Coinbase: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      return createCoinbasePayload(coinbaseBytes);
    }
    case PayloadType.CoinbaseToAltRecipient: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      const altRecipient = deserializeCV(bytesReader) as PrincipalCV;
      return createCoinbasePayload(coinbaseBytes, altRecipient);
    }
    case PayloadType.NakamotoCoinbase: {
      const coinbaseBytes = bytesReader.readBytes(COINBASE_BYTES_LENGTH);
      const recipient = deserializeCV(bytesReader) as OptionalCV<PrincipalCV>;
      const vrfProof = bytesReader.readBytes(VRF_PROOF_BYTES_LENGTH);
      return createNakamotoCoinbasePayload(coinbaseBytes, recipient, vrfProof);
    }
    case PayloadType.TenureChange:
      const tenureHash = bytesToHex(bytesReader.readBytes(20));
      const previousTenureHash = bytesToHex(bytesReader.readBytes(20));
      const burnViewHash = bytesToHex(bytesReader.readBytes(20));
      const previousTenureEnd = bytesToHex(bytesReader.readBytes(32));
      const previousTenureBlocks = bytesReader.readUInt32BE();
      const cause = bytesReader.readUInt8Enum(TenureChangeCause, n => {
        throw new Error(`Cannot recognize TenureChangeCause: ${n}`);
      });
      const publicKeyHash = bytesToHex(bytesReader.readBytes(20));
      return createTenureChangePayload(
        tenureHash,
        previousTenureHash,
        burnViewHash,
        previousTenureEnd,
        previousTenureBlocks,
        cause,
        publicKeyHash
      );
  }
}

export function deserializeMessageSignature(serialized: string): MessageSignatureWire {
  return deserializeMessageSignatureBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeMessageSignatureBytes(
  serialized: Uint8Array | BytesReader
): MessageSignatureWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  return createMessageSignature(
    bytesToHex(bytesReader.readBytes(RECOVERABLE_ECDSA_SIG_LENGTH_BYTES))
  );
}

export function deserializeTransactionAuthField(serialized: string): TransactionAuthFieldWire {
  return deserializeTransactionAuthFieldBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeTransactionAuthFieldBytes(
  serialized: Uint8Array | BytesReader
): TransactionAuthFieldWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const authFieldType = bytesReader.readUInt8Enum(AuthFieldType, n => {
    throw new DeserializationError(`Could not read ${n} as AuthFieldType`);
  });

  switch (authFieldType) {
    case AuthFieldType.PublicKeyCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializePublicKeyBytes(bytesReader)
      );
    case AuthFieldType.PublicKeyUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        createStacksPublicKey(uncompressPublicKey(deserializePublicKeyBytes(bytesReader).data))
      );
    case AuthFieldType.SignatureCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializeMessageSignatureBytes(bytesReader)
      );
    case AuthFieldType.SignatureUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        deserializeMessageSignatureBytes(bytesReader)
      );
    default:
      throw new Error(`Unknown auth field type: ${JSON.stringify(authFieldType)}`);
  }
}

export function serializeMessageSignature(messageSignature: MessageSignatureWire): string {
  return bytesToHex(serializeMessageSignatureBytes(messageSignature));
}
/** @ignore */
export function serializeMessageSignatureBytes(messageSignature: MessageSignatureWire): Uint8Array {
  return hexToBytes(messageSignature.data);
}

export function serializeTransactionAuthField(field: TransactionAuthFieldWire): string {
  return bytesToHex(serializeTransactionAuthFieldBytes(field));
}
/** @ignore */
export function serializeTransactionAuthFieldBytes(field: TransactionAuthFieldWire): Uint8Array {
  const bytesArray = [];

  switch (field.contents.type) {
    case StacksWireType.PublicKey:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.PublicKeyCompressed
          : AuthFieldType.PublicKeyUncompressed
      );
      bytesArray.push(hexToBytes(compressPublicKey(field.contents.data)));
      break;
    case StacksWireType.MessageSignature:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.SignatureCompressed
          : AuthFieldType.SignatureUncompressed
      );
      bytesArray.push(serializeMessageSignatureBytes(field.contents));
      break;
  }

  return concatArray(bytesArray);
}

export function serializePublicKey(key: PublicKeyWire): string {
  return bytesToHex(serializePublicKeyBytes(key));
}
/** @ignore */
export function serializePublicKeyBytes(key: PublicKeyWire): Uint8Array {
  return key.data.slice();
}

export function deserializePublicKey(serialized: string): PublicKeyWire {
  return deserializePublicKeyBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePublicKeyBytes(serialized: Uint8Array | BytesReader): PublicKeyWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const fieldId = bytesReader.readUInt8();
  const keyLength =
    fieldId === 4 ? UNCOMPRESSED_PUBKEY_LENGTH_BYTES : COMPRESSED_PUBKEY_LENGTH_BYTES;
  return createStacksPublicKey(concatArray([fieldId, bytesReader.readBytes(keyLength)]));
}
