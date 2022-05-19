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
  intToHex,
  parseRecoverableSignatureVrs,
  privateKeyToBuffer,
  PRIVATE_KEY_COMPRESSED_LENGTH,
  signatureRsvToVrs,
  signatureVrsToRsv,
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
import { BufferArray, hash160, hashP2PKH } from './utils';

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

export function publicKeyFromSignatureVrs(
  message: string,
  messageSignature: MessageSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  const parsedSignature = parseRecoverableSignatureVrs(messageSignature.data);
  const signature = new Signature(hexToBigInt(parsedSignature.r), hexToBigInt(parsedSignature.s));
  const point = Point.fromSignature(message, signature, parsedSignature.recoveryId);
  const compressed = pubKeyEncoding === PubKeyEncoding.Compressed;
  return point.toHex(compressed);
}

export function publicKeyFromSignatureRsv(
  message: string,
  messageSignature: MessageSignature,
  pubKeyEncoding = PubKeyEncoding.Compressed
): string {
  return publicKeyFromSignatureVrs(
    message,
    { ...messageSignature, data: signatureRsvToVrs(messageSignature.data) },
    pubKeyEncoding
  );
}

/**
 * @deprecated use {@link publicKeyFromSignatureRsv} (recommended) or {@link publicKeyFromSignatureVrs} instead
 */
export const publicKeyFromSignature = publicKeyFromSignatureVrs;

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
 * original message can be verified using {@link verifyMessageSignature}
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

/**
 * @deprecated
 * This method is now exported from `@stacks/common` {@link parseRecoverableSignatureVrs}
 */
export const parseRecoverableSignature = parseRecoverableSignatureVrs;

export function getPublicKey(privateKey: StacksPrivateKey): StacksPublicKey {
  return pubKeyfromPrivKey(privateKey.data);
}

export function privateKeyToString(privateKey: StacksPrivateKey): string {
  return privateKey.data.toString('hex');
}

export function publicKeyToAddress(version: AddressVersion, publicKey: StacksPublicKey): string {
  return c32address(version, hash160(publicKey.data).toString('hex'));
}
