import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey as nobleGetPublicKey, signSync, utils } from '@noble/secp256k1';
import {
  bytesToHex,
  concatBytes,
  hexToBytes,
  privateKeyToBytes,
  PRIVATE_KEY_COMPRESSED_LENGTH,
  readUInt8,
} from '@stacks/common';
import base58 from 'bs58';
import { hashRipemd160 } from './hashRipemd160';
import { hashSha256Sync } from './sha2Hash';

const BITCOIN_PUBKEYHASH = 0x00;

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

/**
 * @ignore
 */
export function makeECPrivateKey() {
  return bytesToHex(utils.randomPrivateKey());
}

/**
 * Based on bitcoinjs-lib MIT https://github.com/bitcoinjs/bs58check/blob/12b3e700f355c5c49d0be3f8fc29be6c66e753e9/base.js
 * @ignore
 */
export function base58CheckDecode(btcAddress: string): {
  version: number;
  hash: Uint8Array;
} {
  const bytes = base58.decode(btcAddress);
  const payload = bytes.slice(0, -4);
  const checksum = bytes.slice(-4);
  const newChecksum = sha256(sha256(payload));

  if (
    (checksum[0] ^ newChecksum[0]) |
    (checksum[1] ^ newChecksum[1]) |
    (checksum[2] ^ newChecksum[2]) |
    (checksum[3] ^ newChecksum[3])
  ) {
    throw new Error('Invalid checksum');
  }

  if (payload.length !== 21) throw new TypeError('Invalid address length');

  const version = readUInt8(payload, 0);
  const hash = payload.slice(1);

  return { version, hash };
}

/**
 * @ignore
 */
export function base58Encode(hash: Uint8Array) {
  const checksum = sha256(sha256(hash));
  return base58.encode(concatBytes(hash, checksum).slice(0, hash.length + 4));
}

/**
 * @ignore
 */
export function base58CheckEncode(version: number, hash: Uint8Array) {
  return base58Encode(concatBytes(new Uint8Array([version]), hash.slice(0, 20)));
}

/**
 * @ignore
 */
export function publicKeyToBtcAddress(
  publicKey: string | Uint8Array,
  version: number = BITCOIN_PUBKEYHASH
) {
  const publicKeyBytes = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const publicKeyHash160 = hashRipemd160(hashSha256Sync(publicKeyBytes));
  return base58CheckEncode(version, publicKeyHash160);
}

/**
 * @ignore
 * @returns a compressed public key
 */
export function getPublicKeyFromPrivate(privateKey: string | Uint8Array): string {
  const privateKeyBytes = privateKeyToBytes(privateKey);
  // for backwards compatibility we always return a compressed public key, regardless of private key mode
  return bytesToHex(nobleGetPublicKey(privateKeyBytes.slice(0, 32), true));
}

/**
 * @ignore
 */
export function ecSign(messageHash: Uint8Array, hexPrivateKey: string | Uint8Array) {
  return signSync(messageHash, privateKeyToBytes(hexPrivateKey).slice(0, 32), {
    der: false,
  });
}

/**
 * @ignore
 */
export function isValidPrivateKey(privateKey: string | Uint8Array): boolean {
  return utils.isValidPrivateKey(privateKeyToBytes(privateKey));
}

/**
 * @ignore
 */
export function compressPrivateKey(privateKey: string | Uint8Array): Uint8Array {
  const privateKeyBytes = privateKeyToBytes(privateKey);

  return privateKeyBytes.length == PRIVATE_KEY_COMPRESSED_LENGTH
    ? privateKeyBytes // leave compressed
    : concatBytes(privateKeyBytes, new Uint8Array([1])); // compress
}
