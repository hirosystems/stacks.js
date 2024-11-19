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
  hexToBigInt,
  hexToBytes,
  intToHex,
  parseRecoverableSignatureVrs,
  PRIVATE_KEY_BYTES_COMPRESSED,
  PrivateKey,
  privateKeyToBytes,
  PublicKey,
  signatureRsvToVrs,
  signatureVrsToRsv,
} from '@stacks/common';
import { networkFrom, STACKS_MAINNET, StacksNetwork, StacksNetworkName } from '@stacks/network';
import { c32address } from 'c32check';
import { addressHashModeToVersion } from './address';
import { AddressHashMode, AddressVersion, PubKeyEncoding } from './constants';
import { hash160, hashP2PKH } from './utils';
import { addressFromVersionHash, addressToString, PublicKeyWire, StacksWireType } from './wire';

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

/** Creates a P2PKH address string from the given private key and tx version. */
export function getAddressFromPrivateKey(
  /** Private key bytes or hex string */
  privateKey: PrivateKey,
  network: StacksNetworkName | StacksNetwork = 'mainnet'
): string {
  network = networkFrom(network);
  const publicKey = privateKeyToPublic(privateKey);
  return getAddressFromPublicKey(publicKey, network);
}

/** Creates a P2PKH address string from the given public key and tx version. */
export function getAddressFromPublicKey(
  /** Public key bytes or hex string */
  publicKey: PublicKey,
  network: StacksNetworkName | StacksNetwork = 'mainnet'
): string {
  network = networkFrom(network);
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  const addrVer = addressHashModeToVersion(AddressHashMode.P2PKH, network);
  const addr = addressFromVersionHash(addrVer, hashP2PKH(publicKey));
  const addrString = addressToString(addr);
  return addrString;
}

export function createStacksPublicKey(publicKey: PublicKey): PublicKeyWire {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return {
    type: StacksWireType.PublicKey,
    data: publicKey,
  };
}

export function publicKeyFromSignatureVrs(
  messageHash: string,
  messageSignature: string,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  const parsedSignature = parseRecoverableSignatureVrs(messageSignature);
  const signature = new Signature(hexToBigInt(parsedSignature.r), hexToBigInt(parsedSignature.s));
  const point = Point.fromSignature(messageHash, signature, parsedSignature.recoveryId);
  const compressed = pubKeyEncoding === PubKeyEncoding.Compressed;
  return point.toHex(compressed);
}

export function publicKeyFromSignatureRsv(
  messageHash: string,
  messageSignature: string,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  return publicKeyFromSignatureVrs(
    messageHash,
    signatureRsvToVrs(messageSignature),
    pubKeyEncoding
  );
}

export function privateKeyToHex(publicKey: PublicKey): string {
  return typeof publicKey === 'string' ? publicKey : bytesToHex(publicKey);
}
export const publicKeyToHex = privateKeyToHex;

/**
 * Checks if a private key is compressed
 *
 * @example
 * ```ts
 * isPrivateKeyCompressed('64879bd015b0fbc19a798040b399b59c3c756cc79eaa9d24d18e66106ad7ee4801'); // true
 * isPrivateKeyCompressed('64879bd015b0fbc19a798040b399b59c3c756cc79eaa9d24d18e66106ad7ee48'); // false
 * ```
 */
export const isPrivateKeyCompressed = privateKeyIsCompressed;

/** @deprecated Use {@link isPrivateKeyCompressed} instead */
export function privateKeyIsCompressed(privateKey: PrivateKey): boolean {
  const length = typeof privateKey === 'string' ? privateKey.length / 2 : privateKey.byteLength;
  return length === PRIVATE_KEY_BYTES_COMPRESSED;
}

/**
 * Checks if a public key is compressed
 *
 * @example
 * ```ts
 * isPublicKeyCompressed('0367b23680c33a3adc784b80952f9bba83169d84c6567f49c9a92f7cc9c9b6f61b'); // true
 * isPublicKeyCompressed('04171ee91c13f2007bd22c3280987d113e9ffdb2f10631783473899868e67dcdb876f2be26558ea1d4194a96a3707aff085c96a643d43e02c0e9e67c5d47a7dac6'); // false
 * ```
 */
export const isPublicKeyCompressed = publicKeyIsCompressed;

/** @deprecated Use {@link isPublicKeyCompressed} instead */
export function publicKeyIsCompressed(publicKey: PublicKey): boolean {
  return !publicKeyToHex(publicKey).startsWith('04');
}

/**
 * Get the public key from a private key.
 * Allows for "compressed" and "uncompressed" private keys.
 * > Matches legacy `pubKeyfromPrivKey`, `getPublic` function behavior
 */
export function privateKeyToPublic(privateKey: PrivateKey): PublicKey {
  privateKey = privateKeyToBytes(privateKey);
  const isCompressed = privateKeyIsCompressed(privateKey);
  return bytesToHex(nobleGetPublicKey(privateKey.slice(0, 32), isCompressed));
}

/**
 * Compresses a public key
 *
 * @example
 * ```ts
 * compressPublicKey('04171ee91c13f2007bd22c3280987d113e9ffdb2f10631783473899868e67dcdb876f2be26558ea1d4194a96a3707aff085c96a643d43e02c0e9e67c5d47a7dac6');
 * // '0367b23680c33a3adc784b80952f9bba83169d84c6567f49c9a92f7cc9c9b6f61b'
 * ```
 */
export function compressPublicKey(publicKey: PublicKey): string {
  return Point.fromHex(publicKeyToHex(publicKey)).toHex(true);
}

/**
 * Uncompresses a public key
 *
 * @example
 * ```ts
 * uncompressPublicKey('0367b23680c33a3adc784b80952f9bba83169d84c6567f49c9a92f7cc9c9b6f61b');
 * // '04171ee91c13f2007bd22c3280987d113e9ffdb2f10631783473899868e67dcdb876f2be26558ea1d4194a96a3707aff085c96a643d43e02c0e9e67c5d47a7dac6'
 * ```
 */
export function uncompressPublicKey(publicKey: PublicKey): string {
  return Point.fromHex(publicKeyToHex(publicKey)).toHex(false);
}

/** @deprecated Use {@link randomPrivateKey} instead */
export const makeRandomPrivKey = randomPrivateKey;

/**
 * Generate a random private key (compressed)
 *
 * @example
 * ```ts
 * const privateKey = randomPrivateKey();
 * // 'f5a31c1268a1e37d4edaa05c7d11183c5fbfdcdc48aae36ea4d8cd5cb709932801'
 * ```
 */
export function randomPrivateKey(): string {
  return compressPrivateKey(utils.randomPrivateKey());
}

/**
 * @deprecated The Clarity compatible {@link signMessageHashRsv} is preferred, but differs in signature format
 * @returns A recoverable signature (in VRS order)
 */
export function signWithKey(privateKey: PrivateKey, messageHash: string): string {
  privateKey = privateKeyToBytes(privateKey);
  const [rawSignature, recoveryId] = signSync(messageHash, privateKey.slice(0, 32), {
    canonical: true,
    recovered: true,
  });
  if (recoveryId == null) {
    throw new Error('No signature recoveryId received');
  }
  const recoveryIdHex = intToHex(recoveryId, 1);
  return recoveryIdHex + Signature.fromHex(rawSignature).toCompactHex(); // V + RS
}

/**
 * Signs a message hash using a private key. The resulting signature along with
 * the original message can be verified using {@link verifyMessageSignatureRsv}
 * @returns A recoverable signature (in RSV order)
 */
export function signMessageHashRsv({
  messageHash,
  privateKey,
}: {
  messageHash: string;
  privateKey: PrivateKey;
}): string {
  return signatureVrsToRsv(signWithKey(privateKey, messageHash));
}

/**
 * @ignore
 */
export function compressPrivateKey(privateKey: PrivateKey): string {
  privateKey = privateKeyToHex(privateKey);

  return privateKey.length == PRIVATE_KEY_BYTES_COMPRESSED * 2
    ? privateKey // leave compressed
    : `${privateKey}01`; // compress
}

/**
 * Convert a private key to a single-sig address.
 * @returns A Stacks address string (encoded with c32check)
 * @example
 * ```
 * const address = privateKeyToAddress("73a2f291df5a8ce3ceb668a25ac7af45639513af7596d710ddf59f64f484fd2801");
 * // SP10J81WVGVB3M4PHQN4Q4G0R8586TBJH948RESDR
 * ```
 */
export function privateKeyToAddress(
  privateKey: PrivateKey,
  network?: StacksNetworkName | StacksNetwork
): string {
  const publicKey = privateKeyToPublic(privateKey);
  return publicKeyToAddressSingleSig(publicKey, network);
}

/**
 * Convert a public key to an address.
 * @returns A Stacks address string (encoded with c32check)
 * @example Public key to address
 * ```
 * const address = publicKeyToAddress("03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab");
 * const address = publicKeyToAddress("03ef788b3830c00abe8f64f62dc32fc863bc0b2cafeb073b6c8e1c7657d9c2c3ab", STACKS_TESTNET);
 * ```
 */
export function publicKeyToAddress(
  publicKey: PublicKey,
  network?: StacksNetworkName | StacksNetwork
): string;
export function publicKeyToAddress(version: AddressVersion, publicKey: PublicKey): string;
export function publicKeyToAddress(
  ...args: Parameters<typeof publicKeyToAddressSingleSig> | Parameters<typeof _publicKeyToAddress>
): string {
  if (typeof args[0] === 'number') return _publicKeyToAddress(...args);
  return publicKeyToAddressSingleSig(...args);
}

/** Legacy implementation for backwards compatibility @ignore */
function _publicKeyToAddress(version: AddressVersion, publicKey: PublicKey): string {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return c32address(version, bytesToHex(hash160(publicKey)));
}

/** Alias for {@link publicKeyToAddress} */
export function publicKeyToAddressSingleSig(
  publicKey: PublicKey,
  network?: StacksNetworkName | StacksNetwork
): string {
  network = network ? networkFrom(network) : STACKS_MAINNET;
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return c32address(network.addressVersion.singleSig, bytesToHex(hash160(publicKey)));
}

// todo: add multi-sig address support from [key]s!
