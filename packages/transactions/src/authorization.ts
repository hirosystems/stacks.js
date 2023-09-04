import {
  bytesToHex,
  concatArray,
  hexToBytes,
  IntegerType,
  intToBigInt,
  intToBytes,
  writeUInt16BE,
} from '@stacks/common';
import {
  AddressHashMode,
  AuthType,
  MultiSigHashMode,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  SingleSigHashMode,
  StacksMessageType,
} from './constants';

import { cloneDeep, leftPadHex, txidFromData } from './utils';
import {
  TransactionAuthField,
  serializeMessageSignature,
  deserializeMessageSignature,
} from './signature';
import {
  addressFromPublicKeys,
  createEmptyAddress,
  createLPList,
  deserializeLPList,
  serializeLPList,
} from './types';

import {
  createStacksPublicKey,
  getPublicKey,
  isCompressed,
  publicKeyFromSignatureVrs,
  signWithKey,
  StacksPrivateKey,
  StacksPublicKey,
} from './keys';

import { MessageSignature } from './common';
import { DeserializationError, SigningError, VerificationError } from './errors';
import { BytesReader } from './bytesReader';

export function emptyMessageSignature(): MessageSignature {
  return {
    type: StacksMessageType.MessageSignature,
    data: bytesToHex(new Uint8Array(RECOVERABLE_ECDSA_SIG_LENGTH_BYTES)),
  };
}

export interface SingleSigSpendingCondition {
  hashMode: SingleSigHashMode;
  signer: string;
  nonce: bigint;
  fee: bigint;
  keyEncoding: PubKeyEncoding;
  signature: MessageSignature;
}

export interface SingleSigSpendingConditionOpts
  extends Omit<SingleSigSpendingCondition, 'nonce' | 'fee'> {
  nonce: IntegerType;
  fee: IntegerType;
}

export interface MultiSigSpendingCondition {
  hashMode: MultiSigHashMode;
  signer: string;
  nonce: bigint;
  fee: bigint;
  fields: TransactionAuthField[];
  signaturesRequired: number;
}

export interface MultiSigSpendingConditionOpts
  extends Omit<MultiSigSpendingCondition, 'nonce' | 'fee'> {
  nonce: IntegerType;
  fee: IntegerType;
}

export type SpendingCondition = SingleSigSpendingCondition | MultiSigSpendingCondition;

export type SpendingConditionOpts = SingleSigSpendingConditionOpts | MultiSigSpendingConditionOpts;

export function createSingleSigSpendingCondition(
  hashMode: SingleSigHashMode,
  pubKey: string,
  nonce: IntegerType,
  fee: IntegerType
): SingleSigSpendingCondition {
  // address version arg doesn't matter for signer hash generation
  const signer = addressFromPublicKeys(
    0 as any, // only used for hash, so version doesn't matter
    hashMode,
    1,
    [createStacksPublicKey(pubKey)]
  ).hash160;
  const keyEncoding = isCompressed(createStacksPublicKey(pubKey))
    ? PubKeyEncoding.Compressed
    : PubKeyEncoding.Uncompressed;

  return {
    hashMode,
    signer,
    nonce: intToBigInt(nonce, false),
    fee: intToBigInt(fee, false),
    keyEncoding,
    signature: emptyMessageSignature(),
  };
}

export function createMultiSigSpendingCondition(
  hashMode: MultiSigHashMode,
  numSigs: number,
  pubKeys: string[],
  nonce: IntegerType,
  fee: IntegerType
): MultiSigSpendingCondition {
  const stacksPublicKeys = pubKeys.map(createStacksPublicKey);

  // address version arg doesn't matter for signer hash generation
  const signer = addressFromPublicKeys(
    0 as any, // only used for hash, so version doesn't matter
    hashMode,
    numSigs,
    stacksPublicKeys
  ).hash160;

  return {
    hashMode,
    signer,
    nonce: intToBigInt(nonce, false),
    fee: intToBigInt(fee, false),
    fields: [],
    signaturesRequired: numSigs,
  };
}

export function isSingleSig(
  condition: SpendingConditionOpts
): condition is SingleSigSpendingConditionOpts {
  return 'signature' in condition;
}

function clearCondition(condition: SpendingConditionOpts): SpendingCondition {
  const cloned = cloneDeep(condition);
  cloned.nonce = 0;
  cloned.fee = 0;

  if (isSingleSig(cloned)) {
    cloned.signature = emptyMessageSignature();
  } else {
    cloned.fields = [];
  }

  return {
    ...cloned,
    nonce: BigInt(0),
    fee: BigInt(0),
  };
}

export function serializeSingleSigSpendingCondition(
  condition: SingleSigSpendingConditionOpts
): Uint8Array {
  const bytesArray = [
    condition.hashMode,
    hexToBytes(condition.signer),
    intToBytes(condition.nonce, false, 8),
    intToBytes(condition.fee, false, 8),
    condition.keyEncoding as number,
    serializeMessageSignature(condition.signature),
  ];
  return concatArray(bytesArray);
}

export function serializeMultiSigSpendingCondition(
  condition: MultiSigSpendingConditionOpts
): Uint8Array {
  const bytesArray = [
    condition.hashMode,
    hexToBytes(condition.signer),
    intToBytes(condition.nonce, false, 8),
    intToBytes(condition.fee, false, 8),
  ];

  const fields = createLPList(condition.fields);
  bytesArray.push(serializeLPList(fields));

  const numSigs = new Uint8Array(2);
  writeUInt16BE(numSigs, condition.signaturesRequired, 0);
  bytesArray.push(numSigs);

  return concatArray(bytesArray);
}

export function deserializeSingleSigSpendingCondition(
  hashMode: SingleSigHashMode,
  bytesReader: BytesReader
): SingleSigSpendingCondition {
  const signer = bytesToHex(bytesReader.readBytes(20));
  const nonce = BigInt(`0x${bytesToHex(bytesReader.readBytes(8))}`);
  const fee = BigInt(`0x${bytesToHex(bytesReader.readBytes(8))}`);

  const keyEncoding = bytesReader.readUInt8Enum(PubKeyEncoding, n => {
    throw new DeserializationError(`Could not parse ${n} as PubKeyEncoding`);
  });
  if (hashMode === AddressHashMode.SerializeP2WPKH && keyEncoding != PubKeyEncoding.Compressed) {
    throw new DeserializationError(
      'Failed to parse singlesig spending condition: incomaptible hash mode and key encoding'
    );
  }
  const signature = deserializeMessageSignature(bytesReader);
  return {
    hashMode,
    signer,
    nonce,
    fee,
    keyEncoding,
    signature,
  };
}

export function deserializeMultiSigSpendingCondition(
  hashMode: MultiSigHashMode,
  bytesReader: BytesReader
): MultiSigSpendingCondition {
  const signer = bytesToHex(bytesReader.readBytes(20));
  const nonce = BigInt('0x' + bytesToHex(bytesReader.readBytes(8)));
  const fee = BigInt('0x' + bytesToHex(bytesReader.readBytes(8)));

  const fields = deserializeLPList(bytesReader, StacksMessageType.TransactionAuthField)
    .values as TransactionAuthField[];

  let haveUncompressed = false;
  let numSigs = 0;

  for (const field of fields) {
    switch (field.contents.type) {
      case StacksMessageType.PublicKey:
        if (!isCompressed(field.contents)) haveUncompressed = true;
        break;
      case StacksMessageType.MessageSignature:
        if (field.pubKeyEncoding === PubKeyEncoding.Uncompressed) haveUncompressed = true;
        numSigs += 1;
        if (numSigs === 65536)
          throw new VerificationError(
            'Failed to parse multisig spending condition: too many signatures'
          );
        break;
    }
  }
  const signaturesRequired = bytesReader.readUInt16BE();

  // Partially signed multi-sig tx can be serialized and deserialized without exception (Incorrect number of signatures)
  // No need to check numSigs !== signaturesRequired to throw Incorrect number of signatures error

  if (haveUncompressed && hashMode === AddressHashMode.SerializeP2SH)
    throw new VerificationError('Uncompressed keys are not allowed in this hash mode');

  return {
    hashMode,
    signer,
    nonce,
    fee,
    fields,
    signaturesRequired,
  };
}

export function serializeSpendingCondition(condition: SpendingConditionOpts): Uint8Array {
  if (isSingleSig(condition)) {
    return serializeSingleSigSpendingCondition(condition);
  }
  return serializeMultiSigSpendingCondition(condition);
}

export function deserializeSpendingCondition(bytesReader: BytesReader): SpendingCondition {
  const hashMode = bytesReader.readUInt8Enum(AddressHashMode, n => {
    throw new DeserializationError(`Could not parse ${n} as AddressHashMode`);
  });

  if (hashMode === AddressHashMode.SerializeP2PKH || hashMode === AddressHashMode.SerializeP2WPKH) {
    return deserializeSingleSigSpendingCondition(hashMode, bytesReader);
  } else {
    return deserializeMultiSigSpendingCondition(hashMode, bytesReader);
  }
}

export function makeSigHashPreSign(
  curSigHash: string,
  authType: AuthType,
  fee: IntegerType,
  nonce: IntegerType
): string {
  // new hash combines the previous hash and all the new data this signature will add. This
  // includes:
  // * the previous hash
  // * the auth flag
  // * the tx fee (big-endian 8-byte number)
  // * nonce (big-endian 8-byte number)
  const hashLength = 32 + 1 + 8 + 8;

  const sigHash =
    curSigHash +
    bytesToHex(new Uint8Array([authType])) +
    bytesToHex(intToBytes(fee, false, 8)) +
    bytesToHex(intToBytes(nonce, false, 8));

  if (hexToBytes(sigHash).byteLength !== hashLength) {
    throw Error('Invalid signature hash length');
  }

  return txidFromData(hexToBytes(sigHash));
}

function makeSigHashPostSign(
  curSigHash: string,
  pubKey: StacksPublicKey,
  signature: MessageSignature
): string {
  // new hash combines the previous hash and all the new data this signature will add.  This
  // includes:
  // * the public key compression flag
  // * the signature
  const hashLength = 32 + 1 + RECOVERABLE_ECDSA_SIG_LENGTH_BYTES;

  const pubKeyEncoding = isCompressed(pubKey)
    ? PubKeyEncoding.Compressed
    : PubKeyEncoding.Uncompressed;

  const sigHash = curSigHash + leftPadHex(pubKeyEncoding.toString(16)) + signature.data;

  const sigHashBytes = hexToBytes(sigHash);
  if (sigHashBytes.byteLength > hashLength) {
    throw Error('Invalid signature hash length');
  }

  return txidFromData(sigHashBytes);
}

export function nextSignature(
  curSigHash: string,
  authType: AuthType,
  fee: IntegerType,
  nonce: IntegerType,
  privateKey: StacksPrivateKey
): {
  nextSig: MessageSignature;
  nextSigHash: string;
} {
  const sigHashPreSign = makeSigHashPreSign(curSigHash, authType, fee, nonce);

  const signature = signWithKey(privateKey, sigHashPreSign);
  const publicKey = getPublicKey(privateKey);
  const nextSigHash = makeSigHashPostSign(sigHashPreSign, publicKey, signature);

  return {
    nextSig: signature,
    nextSigHash,
  };
}

export function nextVerification(
  initialSigHash: string,
  authType: AuthType,
  fee: IntegerType,
  nonce: IntegerType,
  pubKeyEncoding: PubKeyEncoding,
  signature: MessageSignature
) {
  const sigHashPreSign = makeSigHashPreSign(initialSigHash, authType, fee, nonce);

  const publicKey = createStacksPublicKey(
    publicKeyFromSignatureVrs(sigHashPreSign, signature, pubKeyEncoding)
  );

  const nextSigHash = makeSigHashPostSign(sigHashPreSign, publicKey, signature);

  return {
    pubKey: publicKey,
    nextSigHash,
  };
}

function newInitialSigHash(): SpendingCondition {
  const spendingCondition = createSingleSigSpendingCondition(
    AddressHashMode.SerializeP2PKH,
    '',
    0,
    0
  );
  spendingCondition.signer = createEmptyAddress().hash160;
  spendingCondition.keyEncoding = PubKeyEncoding.Compressed;
  spendingCondition.signature = emptyMessageSignature();
  return spendingCondition;
}

function verify(
  condition: SpendingConditionOpts,
  initialSigHash: string,
  authType: AuthType
): string {
  if (isSingleSig(condition)) {
    return verifySingleSig(condition, initialSigHash, authType);
  } else {
    return verifyMultiSig(condition, initialSigHash, authType);
  }
}

function verifySingleSig(
  condition: SingleSigSpendingConditionOpts,
  initialSigHash: string,
  authType: AuthType
): string {
  const { pubKey, nextSigHash } = nextVerification(
    initialSigHash,
    authType,
    condition.fee,
    condition.nonce,
    condition.keyEncoding,
    condition.signature
  );

  // address version arg doesn't matter for signer hash generation
  const addrBytes = addressFromPublicKeys(
    0 as any, // only used for hash, so version doesn't matter
    condition.hashMode,
    1,
    [pubKey]
  ).hash160;

  if (addrBytes !== condition.signer)
    throw new VerificationError(
      `Signer hash does not equal hash of public key(s): ${addrBytes} != ${condition.signer}`
    );

  return nextSigHash;
}

function verifyMultiSig(
  condition: MultiSigSpendingConditionOpts,
  initialSigHash: string,
  authType: AuthType
): string {
  const publicKeys: StacksPublicKey[] = [];
  let curSigHash = initialSigHash;
  let haveUncompressed = false;
  let numSigs = 0;

  for (const field of condition.fields) {
    let foundPubKey: StacksPublicKey;

    switch (field.contents.type) {
      case StacksMessageType.PublicKey:
        if (!isCompressed(field.contents)) haveUncompressed = true;
        foundPubKey = field.contents;
        break;
      case StacksMessageType.MessageSignature:
        if (field.pubKeyEncoding === PubKeyEncoding.Uncompressed) haveUncompressed = true;
        const { pubKey, nextSigHash } = nextVerification(
          curSigHash,
          authType,
          condition.fee,
          condition.nonce,
          field.pubKeyEncoding,
          field.contents
        );
        curSigHash = nextSigHash;
        foundPubKey = pubKey;

        numSigs += 1;
        if (numSigs === 65536) throw new VerificationError('Too many signatures');

        break;
    }
    publicKeys.push(foundPubKey);
  }

  if (numSigs !== condition.signaturesRequired)
    throw new VerificationError('Incorrect number of signatures');

  if (haveUncompressed && condition.hashMode === AddressHashMode.SerializeP2SH)
    throw new VerificationError('Uncompressed keys are not allowed in this hash mode');

  const addrBytes = addressFromPublicKeys(
    0 as any, // only used for hash, so version doesn't matter
    condition.hashMode,
    condition.signaturesRequired,
    publicKeys
  ).hash160;
  if (addrBytes !== condition.signer)
    throw new VerificationError(
      `Signer hash does not equal hash of public key(s): ${addrBytes} != ${condition.signer}`
    );

  return curSigHash;
}

export type Authorization = StandardAuthorization | SponsoredAuthorization;

export interface StandardAuthorization {
  authType: AuthType.Standard;
  spendingCondition: SpendingCondition;
}

export interface SponsoredAuthorization {
  authType: AuthType.Sponsored;
  spendingCondition: SpendingCondition;
  sponsorSpendingCondition: SpendingCondition;
}

export function createStandardAuth(spendingCondition: SpendingCondition): StandardAuthorization {
  return {
    authType: AuthType.Standard,
    spendingCondition,
  };
}

export function createSponsoredAuth(
  spendingCondition: SpendingCondition,
  sponsorSpendingCondition?: SpendingCondition
): Authorization {
  return {
    authType: AuthType.Sponsored,
    spendingCondition,
    sponsorSpendingCondition: sponsorSpendingCondition
      ? sponsorSpendingCondition
      : createSingleSigSpendingCondition(AddressHashMode.SerializeP2PKH, '0'.repeat(66), 0, 0),
  };
}

export function intoInitialSighashAuth(auth: Authorization): Authorization {
  if (auth.spendingCondition) {
    switch (auth.authType) {
      case AuthType.Standard:
        return createStandardAuth(clearCondition(auth.spendingCondition));
      case AuthType.Sponsored:
        return createSponsoredAuth(clearCondition(auth.spendingCondition), newInitialSigHash());
      default:
        throw new SigningError('Unexpected authorization type for signing');
    }
  }

  throw new Error('Authorization missing SpendingCondition');
}

export function verifyOrigin(auth: Authorization, initialSigHash: string): string {
  switch (auth.authType) {
    case AuthType.Standard:
      return verify(auth.spendingCondition, initialSigHash, AuthType.Standard);
    case AuthType.Sponsored:
      return verify(auth.spendingCondition, initialSigHash, AuthType.Standard);
    default:
      throw new SigningError('Invalid origin auth type');
  }
}

export function setFee(auth: Authorization, amount: IntegerType): Authorization {
  switch (auth.authType) {
    case AuthType.Standard:
      const spendingCondition = {
        ...auth.spendingCondition,
        fee: intToBigInt(amount, false),
      };
      return { ...auth, spendingCondition };
    case AuthType.Sponsored:
      const sponsorSpendingCondition = {
        ...auth.sponsorSpendingCondition,
        fee: intToBigInt(amount, false),
      };
      return { ...auth, sponsorSpendingCondition };
  }
}

export function getFee(auth: Authorization): bigint {
  switch (auth.authType) {
    case AuthType.Standard:
      return auth.spendingCondition.fee;
    case AuthType.Sponsored:
      return auth.sponsorSpendingCondition.fee;
  }
}

export function setNonce(auth: Authorization, nonce: IntegerType): Authorization {
  const spendingCondition = {
    ...auth.spendingCondition,
    nonce: intToBigInt(nonce, false),
  };

  return {
    ...auth,
    spendingCondition,
  };
}

export function setSponsorNonce(auth: SponsoredAuthorization, nonce: IntegerType): Authorization {
  const sponsorSpendingCondition = {
    ...auth.sponsorSpendingCondition,
    nonce: intToBigInt(nonce, false),
  };

  return {
    ...auth,
    sponsorSpendingCondition,
  };
}

export function setSponsor(
  auth: SponsoredAuthorization,
  sponsorSpendingCondition: SpendingConditionOpts
): Authorization {
  const sc = {
    ...sponsorSpendingCondition,
    nonce: intToBigInt(sponsorSpendingCondition.nonce, false),
    fee: intToBigInt(sponsorSpendingCondition.fee, false),
  };

  return {
    ...auth,
    sponsorSpendingCondition: sc,
  };
}

export function serializeAuthorization(auth: Authorization): Uint8Array {
  const bytesArray = [];
  bytesArray.push(auth.authType);

  switch (auth.authType) {
    case AuthType.Standard:
      bytesArray.push(serializeSpendingCondition(auth.spendingCondition));
      break;
    case AuthType.Sponsored:
      bytesArray.push(serializeSpendingCondition(auth.spendingCondition));
      bytesArray.push(serializeSpendingCondition(auth.sponsorSpendingCondition));
      break;
  }

  return concatArray(bytesArray);
}

export function deserializeAuthorization(bytesReader: BytesReader) {
  const authType = bytesReader.readUInt8Enum(AuthType, n => {
    throw new DeserializationError(`Could not parse ${n} as AuthType`);
  });

  let spendingCondition;
  switch (authType) {
    case AuthType.Standard:
      spendingCondition = deserializeSpendingCondition(bytesReader);
      return createStandardAuth(spendingCondition);
    case AuthType.Sponsored:
      spendingCondition = deserializeSpendingCondition(bytesReader);
      const sponsorSpendingCondition = deserializeSpendingCondition(bytesReader);
      return createSponsoredAuth(spendingCondition, sponsorSpendingCondition);
  }
}
