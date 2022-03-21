import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { getPublicKey, signSync, utils } from '@noble/secp256k1';
import { Buffer } from '@stacks/common';
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
  return Buffer.from(getPublicKey(privateKeyToBuffer(privateKey), true)).toString('hex');
}

/**
 * Time
 * @private
 * @ignore
 */
function privateKeyToBuffer(privateKey: string | Buffer): Buffer {
  const privateKeyBuffer = Buffer.isBuffer(privateKey)
    ? privateKey
    : Buffer.from(privateKey, 'hex');

  switch (privateKeyBuffer.length) {
    case 32:
      return privateKeyBuffer;
    case 33:
      if (privateKeyBuffer[32] !== 1) {
        throw new Error(
          'Improperly formatted compressed private-key. 66-length hex indicates compressed key, but the last byte must be == 1'
        );
      }
      return privateKeyBuffer.slice(0, 32);
    default:
      throw new Error(
        'Improperly formatted compressed private-key. Private-key hex length should be 64 or 66.'
      );
  }
}

/**
 *
 * @ignore
 */
export function ecSign(messageHash: Buffer, hexPrivateKey: string | Buffer) {
  return Buffer.from(
    signSync(messageHash, privateKeyToBuffer(hexPrivateKey), {
      der: false,
    })
  );
}

/**
 *
 * @ignore
 */
export function ecPrivateKeyToHexString(privateKey: Buffer) {
  // add 01 suffix for backward compatibility
  return `${privateKey.toString('hex')}01`;
}

/**
 *
 * @ignore
 */
export function isValidPrivateKey(privateKey: string | Buffer) {
  return utils.isValidPrivateKey(privateKeyToBuffer(privateKey));
}
