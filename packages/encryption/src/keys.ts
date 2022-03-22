import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey, signSync, utils } from '@noble/secp256k1';
import { Buffer, privateKeyToBuffer, PRIVATE_KEY_COMPRESSED_LENGTH } from '@stacks/common';
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
  return Buffer.from(utils.randomPrivateKey()).toString('hex');
}

/**
 * @ignore
 */
export function base58Encode(hash: Buffer) {
  const checksum = sha256(sha256(hash));
  return base58.encode(Buffer.concat([hash, checksum], hash.length + 4));
}

/**
 * @ignore
 */
export function hashToBase58Check(hash: Buffer) {
  return base58Encode(Buffer.from([BITCOIN_PUBKEYHASH, ...hash].slice(0, 21)));
}

/**
 * @ignore
 */
export function publicKeyToAddress(publicKey: string | Buffer) {
  const publicKeyBuffer = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey, 'hex');
  const publicKeyHash160 = hashRipemd160(hashSha256Sync(publicKeyBuffer));
  return hashToBase58Check(publicKeyHash160);
}

/**
 * @ignore
 */
export function getPublicKeyFromPrivate(privateKey: string | Buffer) {
  const privateKeyBuffer = privateKeyToBuffer(privateKey);
  const shouldCompressPublicKey = privateKeyBuffer.length == PRIVATE_KEY_COMPRESSED_LENGTH;
  return Buffer.from(getPublicKey(privateKeyBuffer.slice(0, 32), shouldCompressPublicKey)).toString(
    'hex'
  );
}

/**
 * @ignore
 */
export function ecSign(messageHash: Buffer, hexPrivateKey: string | Buffer) {
  return Buffer.from(
    signSync(messageHash, privateKeyToBuffer(hexPrivateKey).slice(0, 32), {
      der: false,
    })
  );
}

/**
 * @ignore
 */
export function ecPrivateKeyToHexString(privateKey: Buffer): string {
  return privateKey.toString('hex');
}

/**
 * @ignore
 */
export function isValidPrivateKey(privateKey: string | Buffer): boolean {
  return utils.isValidPrivateKey(privateKeyToBuffer(privateKey));
}

/**
 * @ignore
 */
export function compressPrivateKey(privateKey: string | Buffer): string {
  const privateKeyBuffer = privateKeyToBuffer(privateKey);

  const compressedPrivateKeyBuffer =
    privateKeyBuffer.length == PRIVATE_KEY_COMPRESSED_LENGTH
      ? privateKeyBuffer
      : Buffer.concat([privateKeyBuffer, Buffer.from([1])]);

  return ecPrivateKeyToHexString(compressedPrivateKeyBuffer);
}
