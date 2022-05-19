import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import {
  getPublicKey as nobleGetPublicKey,
  Point,
  Signature,
  signSync,
  utils,
} from '@noble/secp256k1';
import {
  Buffer,
  bytesToHex,
  hexToBigInt,
  hexToInt,
  intToHex,
  privateKeyToBuffer,
  PRIVATE_KEY_COMPRESSED_LENGTH,
  parseRecoverableSignature as parseRecoverableSignatureFromCommon,
} from '@stacks/common';
import { c32address } from 'c32check';
import { BufferReader } from './bufferReader';
import {
  addressFromVersionHash,
  addressHashModeToVersion,
  addressToString,
  createMessageSignature,
  MessageSignature,
} from './common';
import {
  AddressHashMode,
  AddressVersion,
  COMPRESSED_PUBKEY_LENGTH_BYTES,
  PubKeyEncoding,
  StacksMessageType,
  TransactionVersion,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
} from './constants';
import { BufferArray, hash160, hashP2PKH, leftPadHexToLength } from './utils';

/**
 * To use secp256k1.signSync set utils.hmacSha256Sync to a function using noble-hashes
 * secp256k1.signSync is the counter part of secp256k1.sign (async version)
 * secp256k1.signSync is used within signWithKey in this file
 * secp256k1.signSync is used to maintain the semantics of signWithKey while migrating from elliptic lib
 * utils.hmacSha256Sync docs: https://github.com/paulmillr/noble-secp256k1 readme file
 */
utils.hmacSha256Sync = (key: Uint8Array, ...msgs: Uint8Array[]) => {
  const h = hmac.create(sha256, key);
  msgs.forEach(msg => h.update(msg));
  return h.digest();
};

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

export function publicKeyFromSignature(
  message: string,
  messageSignature: MessageSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  const parsedSignature = parseRecoverableSignature(messageSignature.data);
  const signature = new Signature(hexToBigInt(parsedSignature.r), hexToBigInt(parsedSignature.s));
  const point = Point.fromSignature(message, signature, parsedSignature.recoveryParam);
  const compressed = pubKeyEncoding === PubKeyEncoding.Compressed;
  return point.toHex(compressed);
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
  const publicKey = nobleGetPublicKey(privKey.data.slice(0, 32), privKey.compressed);
  return createStacksPublicKey(bytesToHex(publicKey));
}

export function compressPublicKey(publicKey: string | Buffer): StacksPublicKey {
  const hex = typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
  const compressed = Point.fromHex(hex).toHex(true);
  return createStacksPublicKey(compressed);
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
  // "compressed" private key is a misnomer: https://web.archive.org/web/20220131144208/https://www.oreilly.com/library/view/mastering-bitcoin/9781491902639/ch04.html#comp_priv
  // it actually means: should public keys be generated as "compressed" or "uncompressed" from this private key
  compressed: boolean;
  data: Buffer;
}

export function createStacksPrivateKey(key: string | Buffer): StacksPrivateKey {
  const data = privateKeyToBuffer(key);
  const compressed = data.length == PRIVATE_KEY_COMPRESSED_LENGTH;
  return { data, compressed };
}

export function makeRandomPrivKey(): StacksPrivateKey {
  return createStacksPrivateKey(bytesToHex(utils.randomPrivateKey()));
}

export function signWithKey(privateKey: StacksPrivateKey, input: string): MessageSignature {
  const [rawSignature, recoveryParam] = signSync(input, privateKey.data.slice(0, 32), {
    canonical: true,
    recovered: true,
  });
  const signature = Signature.fromHex(rawSignature);
  const coordinateValueBytes = 32;
  const r = leftPadHexToLength(signature.r.toString(16), coordinateValueBytes * 2);
  const s = leftPadHexToLength(signature.s.toString(16), coordinateValueBytes * 2);

  if (recoveryParam === undefined || recoveryParam === null) {
    throw new Error('"signature.recoveryParam" is not set');
  }
  const recoveryParamHex = intToHex(recoveryParam, 1);
  const recoverableSignatureString = r + s + recoveryParamHex;
  return createMessageSignature(recoverableSignatureString);
}

export function getSignatureRecoveryParam(signature: string) {
  const coordinateValueBytes = 32;
  if (signature.length < coordinateValueBytes * 2 * 2 + 1) {
    throw new Error('Invalid signature');
  }
  const recoveryParamHex = signature.substr(0, 2);
  return hexToInt(recoveryParamHex);
}

/**
 * @deprecated
 * This method is now exported from `@stacks/common` {@link parseRecoverableSignature}
 */
export const parseRecoverableSignature = parseRecoverableSignatureFromCommon;

export function getPublicKey(privateKey: StacksPrivateKey): StacksPublicKey {
  return pubKeyfromPrivKey(privateKey.data);
}

export function privateKeyToString(privateKey: StacksPrivateKey): string {
  return privateKey.data.toString('hex');
}

export function publicKeyToAddress(version: AddressVersion, publicKey: StacksPublicKey): string {
  return c32address(version, hash160(publicKey.data).toString('hex'));
}
