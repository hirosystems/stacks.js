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
  isInstance,
  parseRecoverableSignatureVrs,
  PRIVATE_KEY_COMPRESSED_LENGTH,
  PrivateKey,
  privateKeyToBytes,
  PublicKey,
  signatureRsvToVrs,
  signatureVrsToRsv,
} from '@stacks/common';
import {
  networkFrom,
  STACKS_MAINNET,
  StacksNetwork,
  StacksNetworkName,
  TransactionVersion,
} from '@stacks/network';
import { c32address } from 'c32check';
import { addressHashModeToVersion } from './address';
import { BytesReader } from './BytesReader';
import {
  AddressHashMode,
  AddressVersion,
  COMPRESSED_PUBKEY_LENGTH_BYTES,
  PubKeyEncoding,
  UNCOMPRESSED_PUBKEY_LENGTH_BYTES,
} from './constants';
import { hash160, hashP2PKH } from './utils';
import {
  addressFromVersionHash,
  addressToString,
  createMessageSignature,
  MessageSignatureWire,
  PublicKeyWire,
  StacksWireType,
  StructuredDataSignatureWire,
} from './wire';

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

export function createStacksPublicKey(publicKey: PublicKey): PublicKeyWire {
  publicKey = typeof publicKey === 'string' ? hexToBytes(publicKey) : publicKey;
  return {
    type: StacksWireType.PublicKey,
    data: publicKey,
  };
}

export function publicKeyFromSignatureVrs(
  messageHash: string,
  messageSignature: MessageSignatureWire | StructuredDataSignatureWire,
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
  messageSignature: MessageSignatureWire | StructuredDataSignatureWire,
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

export function serializePublicKey(key: PublicKeyWire): string {
  return bytesToHex(serializePublicKeyBytes(key));
}
/** @ignore */
export function serializePublicKeyBytes(key: PublicKeyWire): Uint8Array {
  return key.data.slice();
}

/**
 * Get the public key from a private key.
 * Allows for "compressed" and "uncompressed" private keys.
 * > Matches legacy `pubKeyfromPrivKey`, `getPublic` function behavior
 */
export function privateKeyToPublic(privateKey: PrivateKey): string {
  // todo: improve return result type `next`
  privateKey = privateKeyToBytes(privateKey);
  const isCompressed = privateKeyIsCompressed(privateKey);
  return bytesToHex(nobleGetPublicKey(privateKey.slice(0, 32), isCompressed));
}

export function compressPublicKey(publicKey: PublicKey): string {
  return Point.fromHex(publicKeyToHex(publicKey)).toHex(true);
}

export function uncompressPublicKey(publicKey: PublicKey): string {
  return Point.fromHex(publicKeyToHex(publicKey)).toHex(false);
}

export function deserializePublicKey(serialized: string): PublicKeyWire {
  return deserializePublicKeyBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializePublicKeyBytes(serialized: Uint8Array | BytesReader): PublicKeyWire {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const fieldId = bytesReader.readUInt8();
  const keyLength =
    fieldId === 4 ? UNCOMPRESSED_PUBKEY_LENGTH_BYTES : COMPRESSED_PUBKEY_LENGTH_BYTES;
  return createStacksPublicKey(concatArray([fieldId, bytesReader.readBytes(keyLength)]));
}

// todo: double-check for deduplication, rename!
export function makeRandomPrivKey(): string {
  return bytesToHex(utils.randomPrivateKey());
}

/**
 * @deprecated The Clarity compatible {@link signMessageHashRsv} is preferred, but differs in signature format
 * @returns A recoverable signature (in VRS order)
 */
export function signWithKey(privateKey: PrivateKey, messageHash: string): MessageSignatureWire {
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
}): MessageSignatureWire {
  const messageSignature = signWithKey(privateKey, messageHash);
  return { ...messageSignature, data: signatureVrsToRsv(messageSignature.data) };
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
