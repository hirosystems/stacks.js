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
  bytesToHex,
  concatArray,
  hexToBigInt,
  hexToBytes,
  intToHex,
  parseRecoverableSignatureVrs,
  PRIVATE_KEY_COMPRESSED_LENGTH,
  privateKeyToBytes,
  signatureRsvToVrs,
  signatureVrsToRsv,
} from '@stacks/common';
import { c32address } from 'c32check';
import { BytesReader } from './bytesReader';
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
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
} from './constants';
import { hash160, hashP2PKH } from './utils';
import { StructuredDataSignature } from './message-types';
import { TransactionVersion } from '@stacks/network';

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
  readonly data: Uint8Array;
}

/** Creates a P2PKH address string from the given private key and tx version. */
export function getAddressFromPrivateKey(
  /** Private key bytes or hex string */
  privateKey: PrivateKey,
  transactionVersion = TransactionVersion.Mainnet
): string {
  const publicKey = privateKeyToPublic(privateKey);
  return getAddressFromPublicKey(publicKey, transactionVersion);
}

// todo: use network as last parameter instead of txversion param. next refactor
/** Creates a P2PKH address string from the given public key and tx version. */
export function getAddressFromPublicKey(
  /** Public key bytes or hex string */
  publicKey: PublicKey,
  transactionVersion = TransactionVersion.Mainnet
): string {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const addrVer = addressHashModeToVersion(AddressHashMode.SerializeP2PKH, transactionVersion);
  const addr = addressFromVersionHash(addrVer, hashP2PKH(publicKey));
  const addrString = addressToString(addr);
  return addrString;
}

export function createStacksPublicKey(publicKey: PublicKey): StacksPublicKey {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return {
    type: StacksMessageType.PublicKey,
    data: publicKey,
  };
}

export function publicKeyFromSignatureVrs(
  messageHash: string,
  messageSignature: MessageSignature | StructuredDataSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  const parsedSignature = parseRecoverableSignatureVrs(messageSignature.data);
  const signature = new Signature(hexToBigInt(parsedSignature.r), hexToBigInt(parsedSignature.s));
  const point = Point.fromSignature(messageHash, signature, parsedSignature.recoveryId);
  const compressed = pubKeyEncoding === PubKeyEncoding.Compressed;
  return point.toHex(compressed);
}

export function publicKeyFromSignatureRsv(
  messageHash: string,
  messageSignature: MessageSignature | StructuredDataSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  return publicKeyFromSignatureVrs(
    messageHash,
    { ...messageSignature, data: signatureRsvToVrs(messageSignature.data) },
    pubKeyEncoding
  );
}

export function privateKeyToHex(publicKey: PublicKey): string {
  return typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
}
export const publicKeyToHex = privateKeyToHex;

export function privateKeyIsCompressed(privateKey: PrivateKey): boolean {
  const length = typeof privateKey === 'string' ? privateKey.length / 2 : privateKey.byteLength;
  return length === PRIVATE_KEY_COMPRESSED_LENGTH;
}

export function publicKeyIsCompressed(publicKey: PublicKey): boolean {
  return !publicKeyToHex(publicKey).startsWith('04');
}

export function serializePublicKey(key: StacksPublicKey): Uint8Array {
  return key.data.slice();
}

/**
 * Get the public key from a private key.
 * Allows for "compressed" and "uncompressed" private keys.
 * > Matches legacy `pubKeyfromPrivKey`, `getPublic` function behavior
 */
export function privateKeyToPublic(privateKey: PrivateKey): string {
  privateKey = privateKeyToBytes(privateKey);
  const isCompressed = privateKeyIsCompressed(privateKey);
  return bytesToHex(nobleGetPublicKey(privateKey.slice(0, 32), isCompressed));
}

export function compressPublicKey(publicKey: PublicKey): string {
  return Point.fromHex(publicKeyToHex(publicKey)).toHex(true);
}

export function deserializePublicKey(bytesReader: BytesReader): StacksPublicKey {
  const fieldId = bytesReader.readUInt8();
  const keyLength =
    fieldId === 4 ? UNCOMPRESSED_PUBKEY_LENGTH_BYTES : COMPRESSED_PUBKEY_LENGTH_BYTES;
  return createStacksPublicKey(concatArray([fieldId, bytesReader.readBytes(keyLength)]));
}

// todo: double-check for deduplication, rename!
export function makeRandomPrivKey(): string {
  return bytesToHex(utils.randomPrivateKey());
}

// todo: complete refactor
export type PrivateKey = string | Uint8Array;
export type PublicKey = string | Uint8Array;

/**
 * @deprecated The Clarity compatible {@link signMessageHashRsv} is preferred, but differs in signature format
 * @returns A recoverable signature (in VRS order)
 */
export function signWithKey(privateKey: PrivateKey, messageHash: string): MessageSignature {
  privateKey = privateKeyToBytes(privateKey);
  const [rawSignature, recoveryId] = signSync(messageHash, privateKey.slice(0, 32), {
    canonical: true,
    recovered: true,
  });
  if (recoveryId == null) {
    throw new Error('No signature recoveryId received');
  }
  const recoveryIdHex = intToHex(recoveryId, 1);
  const recoverableSignatureString = recoveryIdHex + Signature.fromHex(rawSignature).toCompactHex(); // V + RS
  return createMessageSignature(recoverableSignatureString);
}

/**
 * Signs a message using a private key. The resulting signature along with the
 * original message can be verified using {@link verifyMessageSignatureRsv}
 * @returns A recoverable signature (in RSV order)
 */
export function signMessageHashRsv({
  messageHash,
  privateKey,
}: {
  messageHash: string;
  privateKey: PrivateKey;
}): MessageSignature {
  const messageSignature = signWithKey(privateKey, messageHash);
  return { ...messageSignature, data: signatureVrsToRsv(messageSignature.data) };
}

// todo: use network as last parameter instead of addressversion param. next refactor
export function publicKeyToAddress(version: AddressVersion, publicKey: PublicKey): string {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return c32address(version, bytesToHex(hash160(publicKey)));
}
