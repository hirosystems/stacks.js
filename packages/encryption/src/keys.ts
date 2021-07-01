import { Buffer } from '@stacks/common';
import { ECPair, address, networks, Network } from 'bitcoinjs-lib';
import { randomBytes } from './cryptoRandom';
import { hashSha256Sync } from './sha2Hash';
import { hashRipemd160 } from './hashRipemd160';

/**
 *
 * @param numberOfBytes
 *
 * @ignore
 */
export function getEntropy(arg: number): Buffer {
  if (!arg) {
    arg = 32;
  }
  return randomBytes(arg);
}

/**
 * @ignore
 */
export function makeECPrivateKey() {
  const keyPair = ECPair.makeRandom({ rng: getEntropy });
  return keyPair.privateKey!.toString('hex');
}

/**
 * @ignore
 */
export function publicKeyToAddress(publicKey: string | Buffer) {
  const publicKeyBuffer = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey, 'hex');
  const publicKeyHash160 = hashRipemd160(hashSha256Sync(publicKeyBuffer));
  const result = address.toBase58Check(publicKeyHash160, networks.bitcoin.pubKeyHash);
  return result;
}

/**
 * @ignore
 */
export function getPublicKeyFromPrivate(privateKey: string | Buffer) {
  const privateKeyBuffer = Buffer.isBuffer(privateKey)
    ? privateKey
    : Buffer.from(privateKey, 'hex');
  const keyPair = ECPair.fromPrivateKey(privateKeyBuffer);
  return keyPair.publicKey.toString('hex');
}

/**
 * Time
 * @private
 * @ignore
 */
export function hexStringToECPair(skHex: string, network?: Network): ECPair.ECPairInterface {
  const ecPairOptions = {
    network: network || networks.bitcoin,
    compressed: true,
  };

  if (skHex.length === 66) {
    if (skHex.slice(64) !== '01') {
      throw new Error(
        'Improperly formatted private-key hex string. 66-length hex usually ' +
          'indicates compressed key, but last byte must be == 1'
      );
    }
    return ECPair.fromPrivateKey(Buffer.from(skHex.slice(0, 64), 'hex'), ecPairOptions);
  } else if (skHex.length === 64) {
    ecPairOptions.compressed = false;
    return ECPair.fromPrivateKey(Buffer.from(skHex, 'hex'), ecPairOptions);
  } else {
    throw new Error('Improperly formatted private-key hex string: length should be 64 or 66.');
  }
}

/**
 *
 * @ignore
 */
export function ecPairToHexString(secretKey: ECPair.ECPairInterface) {
  const ecPointHex = secretKey.privateKey!.toString('hex');
  if (secretKey.compressed) {
    return `${ecPointHex}01`;
  } else {
    return ecPointHex;
  }
}

/**
 * Creates a bitcoin address string from an ECPair
 * @private
 * @ignore
 */
export function ecPairToAddress(keyPair: ECPair.ECPairInterface) {
  const sha256 = hashSha256Sync(keyPair.publicKey);
  const hash160 = hashRipemd160(sha256);
  return address.toBase58Check(hash160, keyPair.network.pubKeyHash);
}
