import { Buffer, IntegerType, intToBigInt, intToBytes } from '@stacks/common';
import {
  AddressHashMode,
  AuthType,
  MultiSigHashMode,
  PubKeyEncoding,
  RECOVERABLE_ECDSA_SIG_LENGTH_BYTES,
  SingleSigHashMode,
  StacksMessageType,
} from './constants';

import { BufferArray, cloneDeep, leftPadHex, txidFromData } from './utils';
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
  publicKeyFromSignature,
  signWithKey,
  StacksPrivateKey,
  StacksPublicKey,
} from './keys';

import { BufferReader } from './bufferReader';
import { MessageSignature } from './common';
import { DeserializationError, SigningError, VerificationError } from './errors';

export function emptyMessageSignature(): MessageSignature {
  return {
    type: StacksMessageType.MessageSignature,
    data: Buffer.alloc(RECOVERABLE_ECDSA_SIG_LENGTH_BYTES, 0x00).toString('hex'),
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
  const signer = addressFromPublicKeys(0, hashMode, 1, [createStacksPublicKey(pubKey)]).hash160;
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
  const signer = addressFromPublicKeys(0, hashMode, numSigs, stacksPublicKeys).hash160;

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
): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendByte(condition.hashMode);
  bufferArray.appendHexString(condition.signer);
  bufferArray.push(intToBytes(condition.nonce, false, 8));
  bufferArray.push(intToBytes(condition.fee, false, 8));
  bufferArray.appendByte(condition.keyEncoding);
  bufferArray.push(serializeMessageSignature(condition.signature));
  return bufferArray.concatBuffer();
}

export function serializeMultiSigSpendingCondition(
  condition: MultiSigSpendingConditionOpts
): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendByte(condition.hashMode);
  bufferArray.appendHexString(condition.signer);
  bufferArray.push(intToBytes(condition.nonce, false, 8));
  bufferArray.push(intToBytes(condition.fee, false, 8));

  const fields = createLPList(condition.fields);
  bufferArray.push(serializeLPList(fields));

  const numSigs = Buffer.alloc(2);
  numSigs.writeUInt16BE(condition.signaturesRequired, 0);
  bufferArray.push(numSigs);
  return bufferArray.concatBuffer();
}

export function deserializeSingleSigSpendingCondition(
  hashMode: SingleSigHashMode,
  bufferReader: BufferReader
): SingleSigSpendingCondition {
  const signer = bufferReader.readBuffer(20).toString('hex');
  const nonce = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));
  const fee = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));

  const keyEncoding = bufferReader.readUInt8Enum(PubKeyEncoding, n => {
    throw new DeserializationError(`Could not parse ${n} as PubKeyEncoding`);
  });
  if (hashMode === AddressHashMode.SerializeP2WPKH && keyEncoding != PubKeyEncoding.Compressed) {
    throw new DeserializationError(
      'Failed to parse singlesig spending condition: incomaptible hash mode and key encoding'
    );
  }
  const signature = deserializeMessageSignature(bufferReader);
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
  bufferReader: BufferReader
): MultiSigSpendingCondition {
  const signer = bufferReader.readBuffer(20).toString('hex');
  const nonce = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));
  const fee = BigInt('0x' + bufferReader.readBuffer(8).toString('hex'));

  const fields = deserializeLPList(bufferReader, StacksMessageType.TransactionAuthField)
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
  const signaturesRequired = bufferReader.readUInt16BE();

  if (numSigs !== signaturesRequired) throw new VerificationError(`Incorrect number of signatures`);

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

export function serializeSpendingCondition(condition: SpendingConditionOpts): Buffer {
  if (isSingleSig(condition)) {
    return serializeSingleSigSpendingCondition(condition);
  } else {
    return serializeMultiSigSpendingCondition(condition);
  }
}

export function deserializeSpendingCondition(bufferReader: BufferReader): SpendingCondition {
  const hashMode = bufferReader.readUInt8Enum(AddressHashMode, n => {
    throw new DeserializationError(`Could not parse ${n} as AddressHashMode`);
  });

  if (hashMode === AddressHashMode.SerializeP2PKH || hashMode === AddressHashMode.SerializeP2WPKH) {
    return deserializeSingleSigSpendingCondition(hashMode, bufferReader);
  } else {
    return deserializeMultiSigSpendingCondition(hashMode, bufferReader);
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
    Buffer.from([authType]).toString('hex') +
    intToBytes(fee, false, 8).toString('hex') +
    intToBytes(nonce, false, 8).toString('hex');

  if (Buffer.from(sigHash, 'hex').byteLength !== hashLength) {
    throw Error('Invalid signature hash length');
  }

  return txidFromData(Buffer.from(sigHash, 'hex'));
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

  const sigHashBuffer = Buffer.from(sigHash, 'hex');
  if (sigHashBuffer.byteLength > hashLength) {
    throw Error('Invalid signature hash length');
  }

  return txidFromData(sigHashBuffer);
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
    publicKeyFromSignature(sigHashPreSign, signature, pubKeyEncoding)
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
  const addrBytes = addressFromPublicKeys(0, condition.hashMode, 1, [pubKey]).hash160;

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
    0,
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

export function serializeAuthorization(auth: Authorization): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.appendByte(auth.authType);

  switch (auth.authType) {
    case AuthType.Standard:
      bufferArray.push(serializeSpendingCondition(auth.spendingCondition));
      break;
    case AuthType.Sponsored:
      bufferArray.push(serializeSpendingCondition(auth.spendingCondition));
      bufferArray.push(serializeSpendingCondition(auth.sponsorSpendingCondition));
      break;
  }

  return bufferArray.concatBuffer();
}

export function deserializeAuthorization(bufferReader: BufferReader) {
  const authType = bufferReader.readUInt8Enum(AuthType, n => {
    throw new DeserializationError(`Could not parse ${n} as AuthType`);
  });

  let spendingCondition;
  switch (authType) {
    case AuthType.Standard:
      spendingCondition = deserializeSpendingCondition(bufferReader);
      return createStandardAuth(spendingCondition);
    case AuthType.Sponsored:
      spendingCondition = deserializeSpendingCondition(bufferReader);
      const sponsorSpendingCondition = deserializeSpendingCondition(bufferReader);
      return createSponsoredAuth(spendingCondition, sponsorSpendingCondition);
  }
}
