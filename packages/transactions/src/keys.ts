import {
  COMPRESSED_PUBKEY_LENGTH_BYTES,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
  StacksMessageType,
  AddressHashMode,
  TransactionVersion,
} from './constants';

import {
  BufferArray,
  leftPadHexToLength,
  intToHexString,
  randomBytes,
  hash160,
  hashP2PKH,
  hexStringToInt,
} from './utils';

import { ec as EC } from 'elliptic';

import { MessageSignature, createMessageSignature } from './authorization';
import { BufferReader } from './bufferReader';
import { AddressVersion } from './constants';
import { c32address } from 'c32check';
import { addressHashModeToVersion, addressFromVersionHash, addressToString } from './types';

export interface StacksPublicKey {
  readonly type: StacksMessageType.PublicKey;
  readonly data: Buffer;
}

/** Creates a P2PKH address string from the given private key and tx version. */
export function getAddressFromPrivateKey(
  /** Private key buffer or hex string */
  privateKey: string | Buffer,
  transactionVersion = TransactionVersion.Mainnet
): string {
  const pubKey = pubKeyfromPrivKey(privateKey);
  return getAddressFromPublicKey(pubKey.data, transactionVersion);
}

/** Creates a P2PKH address string from the given public key and tx version. */
export function getAddressFromPublicKey(
  /** Public key buffer or hex string */
  publicKey: string | Buffer,
  transactionVersion = TransactionVersion.Mainnet
): string {
  publicKey = typeof publicKey === 'string' ? publicKey : publicKey.toString('hex');
  const addrVer = addressHashModeToVersion(AddressHashMode.SerializeP2PKH, transactionVersion);
  const addr = addressFromVersionHash(addrVer, hashP2PKH(Buffer.from(publicKey, 'hex')));
  const addrString = addressToString(addr);
  return addrString;
}

export function createStacksPublicKey(key: string): StacksPublicKey {
  return {
    type: StacksMessageType.PublicKey,
    data: Buffer.from(key, 'hex'),
  };
}

export function publicKeyFromSignature(message: string, messageSignature: MessageSignature) {
  const ec = new EC('secp256k1');
  const messageBN = ec
    .keyFromPrivate(message, 'hex')
    .getPrivate()
    .toString(10);

  const parsedSignature = parseRecoverableSignature(messageSignature.data);

  const publicKey = ec.recoverPubKey(
    messageBN,
    parsedSignature,
    parsedSignature.recoveryParam,
    'hex'
  ) as { encodeCompressed: (enc: string) => string };

  return publicKey.encodeCompressed('hex');
}

export function publicKeyFromBuffer(data: Buffer): StacksPublicKey {
  return { type: StacksMessageType.PublicKey, data };
}

export function isCompressed(key: StacksPublicKey): boolean {
  return !key.data.toString('hex').startsWith('04');
}

export function publicKeyToString(key: StacksPublicKey): string {
  return key.data.toString('hex');
}

export function serializePublicKey(key: StacksPublicKey): Buffer {
  const bufferArray: BufferArray = new BufferArray();
  bufferArray.push(key.data);
  return bufferArray.concatBuffer();
}

export function pubKeyfromPrivKey(privateKey: string | Buffer): StacksPublicKey {
  const privKey = createStacksPrivateKey(privateKey);
  const ec = new EC('secp256k1');
  const keyPair = ec.keyFromPrivate(privKey.data.toString('hex').slice(0, 64), 'hex');
  const pubKey = keyPair.getPublic(privKey.compressed, 'hex');
  return createStacksPublicKey(pubKey);
}

export function deserializePublicKey(bufferReader: BufferReader): StacksPublicKey {
  const fieldId = bufferReader.readUInt8();
  const keyLength =
    fieldId !== 4 ? COMPRESSED_PUBKEY_LENGTH_BYTES : UNCOMPRESSED_PUBKEY_LENGTH_BYTES;
  return publicKeyFromBuffer(
    Buffer.concat([Buffer.from([fieldId]), bufferReader.readBuffer(keyLength)])
  );
}

export interface StacksPrivateKey {
  data: Buffer;
  compressed: boolean;
}

export function createStacksPrivateKey(key: string | Buffer): StacksPrivateKey {
  const data = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  let compressed: boolean;
  if (data.length === 33) {
    if (data[data.length - 1] !== 1) {
      throw new Error(
        'Improperly formatted private-key. 33 byte length usually ' +
          'indicates compressed key, but last byte must be == 0x01'
      );
    }
    compressed = true;
  } else if (data.length === 32) {
    compressed = false;
  } else {
    throw new Error(
      `Improperly formatted private-key hex string: length should be 32 or 33 bytes, provided with length ${data.length}`
    );
  }
  return { data, compressed };
}

export function makeRandomPrivKey(entropy?: Buffer): StacksPrivateKey {
  const ec = new EC('secp256k1');
  const options = { entropy: entropy || randomBytes(32) };
  const keyPair = ec.genKeyPair(options);
  const privateKey = keyPair.getPrivate().toString('hex', 32);
  return createStacksPrivateKey(privateKey);
}

export function signWithKey(privateKey: StacksPrivateKey, input: string): MessageSignature {
  const ec = new EC('secp256k1');
  const key = ec.keyFromPrivate(privateKey.data.toString('hex').slice(0, 64), 'hex');
  const signature = key.sign(input, 'hex', { canonical: true });
  const coordinateValueBytes = 32;
  const r = leftPadHexToLength(signature.r.toString('hex'), coordinateValueBytes * 2);
  const s = leftPadHexToLength(signature.s.toString('hex'), coordinateValueBytes * 2);
  if (signature.recoveryParam === undefined || signature.recoveryParam === null) {
    throw new Error('"signature.recoveryParam" is not set');
  }
  const recoveryParam = intToHexString(signature.recoveryParam, 1);
  const recoverableSignatureString = recoveryParam + r + s;
  const recoverableSignature = createMessageSignature(recoverableSignatureString);
  return recoverableSignature;
}

export function getSignatureRecoveryParam(signature: string) {
  const coordinateValueBytes = 32;
  if (signature.length < coordinateValueBytes * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const recoveryParamHex = signature.substr(0, 2);
  return hexStringToInt(recoveryParamHex);
}

export function parseRecoverableSignature(signature: string) {
  const coordinateValueBytes = 32;
  if (signature.length < coordinateValueBytes * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const recoveryParamHex = signature.substr(0, 2);
  const r = signature.substr(2, coordinateValueBytes * 2);
  const s = signature.substr(2 + coordinateValueBytes * 2, coordinateValueBytes * 2);
  return {
    recoveryParam: hexStringToInt(recoveryParamHex),
    r,
    s,
  };
}

export function getPublicKey(privateKey: StacksPrivateKey): StacksPublicKey {
  return pubKeyfromPrivKey(privateKey.data);
}

export function privateKeyToString(privateKey: StacksPrivateKey): string {
  return privateKey.data.toString('hex');
}

export function publicKeyToAddress(version: AddressVersion, publicKey: StacksPublicKey): string {
  return c32address(version, hash160(publicKey.data).toString('hex'));
}
