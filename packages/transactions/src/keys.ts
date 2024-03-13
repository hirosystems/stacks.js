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
  privateKeyToBytes,
  PRIVATE_KEY_COMPRESSED_LENGTH,
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
  TransactionVersion,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
} from './constants';
import { hash160, hashP2PKH } from './utils';
import { StructuredDataSignature } from './message-types';

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
  privateKey: string | Uint8Array,
  transactionVersion = TransactionVersion.Mainnet
): string {
  const pubKey = pubKeyfromPrivKey(privateKey);
  return getAddressFromPublicKey(pubKey.data, transactionVersion);
}

/** Creates a P2PKH address string from the given public key and tx version. */
export function getAddressFromPublicKey(
  /** Public key bytes or hex string */
  publicKey: string | Uint8Array,
  transactionVersion = TransactionVersion.Mainnet
): string {
  publicKey = typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
  const addrVer = addressHashModeToVersion(AddressHashMode.SerializeP2PKH, transactionVersion);
  const addr = addressFromVersionHash(addrVer, hashP2PKH(hexToBytes(publicKey)));
  const addrString = addressToString(addr);
  return addrString;
}

export function createStacksPublicKey(key: string): StacksPublicKey {
  return {
    type: StacksMessageType.PublicKey,
    data: hexToBytes(key),
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

export function publicKeyFromBytes(data: Uint8Array): StacksPublicKey {
  return { type: StacksMessageType.PublicKey, data };
}

export function isCompressed(key: StacksPublicKey): boolean {
  return !bytesToHex(key.data).startsWith('04');
}

export function publicKeyToString(key: StacksPublicKey): string {
  return bytesToHex(key.data);
}

export function serializePublicKey(key: StacksPublicKey): Uint8Array {
  return key.data.slice();
}

export function pubKeyfromPrivKey(privateKey: string | Uint8Array): StacksPublicKey {
  const privKey = createStacksPrivateKey(privateKey);
  const publicKey = nobleGetPublicKey(privKey.data.slice(0, 32), privKey.compressed);
  return createStacksPublicKey(bytesToHex(publicKey));
}

export function compressPublicKey(publicKey: string | Uint8Array): StacksPublicKey {
  const hex = typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
  const compressed = Point.fromHex(hex).toHex(true);
  return createStacksPublicKey(compressed);
}

export function deserializePublicKey(bytesReader: BytesReader): StacksPublicKey {
  const fieldId = bytesReader.readUInt8();
  const keyLength =
    fieldId === 4 ? UNCOMPRESSED_PUBKEY_LENGTH_BYTES : COMPRESSED_PUBKEY_LENGTH_BYTES;
  return publicKeyFromBytes(concatArray([fieldId, bytesReader.readBytes(keyLength)]));
}

export interface StacksPrivateKey {
  // "compressed" private key is a misnomer: https://web.archive.org/web/20220131144208/https://www.oreilly.com/library/view/mastering-bitcoin/9781491902639/ch04.html#comp_priv
  // it actually means: should public keys be generated as "compressed" or "uncompressed" from this private key
  compressed: boolean;
  data: Uint8Array;
}

export function createStacksPrivateKey(key: string | Uint8Array): StacksPrivateKey {
  const data = privateKeyToBytes(key);
  const compressed = data.length == PRIVATE_KEY_COMPRESSED_LENGTH;
  return { data, compressed };
}

export function makeRandomPrivKey(): StacksPrivateKey {
  return createStacksPrivateKey(utils.randomPrivateKey());
}

/**
 * @deprecated The Clarity compatible {@link signMessageHashRsv} is preferred, but differs in signature format
 * @returns A recoverable signature (in VRS order)
 */
export function signWithKey(privateKey: StacksPrivateKey, messageHash: string): MessageSignature {
  const [rawSignature, recoveryId] = signSync(messageHash, privateKey.data.slice(0, 32), {
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
  privateKey: StacksPrivateKey;
}): MessageSignature {
  const messageSignature = signWithKey(privateKey, messageHash);
  return { ...messageSignature, data: signatureVrsToRsv(messageSignature.data) };
}

export function getPublicKey(privateKey: StacksPrivateKey): StacksPublicKey {
  return pubKeyfromPrivKey(privateKey.data);
}

export function privateKeyToString(privateKey: StacksPrivateKey): string {
  return bytesToHex(privateKey.data);
}

export function publicKeyToAddress(version: AddressVersion, publicKey: StacksPublicKey): string {
  return c32address(version, bytesToHex(hash160(publicKey.data)));
}
