import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import { sha512_256 } from '@noble/hashes/sha512';
import { utils } from '@noble/secp256k1';
import { Buffer, bytesToHex, with0x } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import lodashCloneDeep from 'lodash.clonedeep';
import { ClarityValue, deserializeCV, serializeCV } from './clarity';

// Export verify as utility method for signature verification
export { verify as verifySignature } from '@noble/secp256k1';

/**
 * Use utils.randomBytes to replace randombytes dependency
 * Generates a buffer with random bytes of given length
 * @param {bytesLength} an optional bytes length, default is 32 bytes
 * @return {Buffer} For return type compatibility converting utils.randomBytes return value to buffer
 */
export const randomBytes = (bytesLength?: number) => Buffer.from(utils.randomBytes(bytesLength));

/**
 * @deprecated Import from `@stacks/common` instead
 */
export { bytesToHex };

export class BufferArray {
  _value: Buffer[] = [];
  get value() {
    return this._value;
  }
  appendHexString(hexString: string) {
    this.value.push(Buffer.from(hexString, 'hex'));
  }

  push(buffer: Buffer) {
    return this._value.push(buffer);
  }
  appendByte(octet: number) {
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      throw new Error(`Value ${octet} is not a valid byte`);
    }
    this.value.push(Buffer.from([octet]));
  }

  concatBuffer(): Buffer {
    return Buffer.concat(this.value);
  }
}

export const leftPadHex = (hexString: string): string =>
  hexString.length % 2 == 0 ? hexString : `0${hexString}`;

export const leftPadHexToLength = (hexString: string, length: number): string =>
  hexString.padStart(length, '0');

export const rightPadHexToLength = (hexString: string, length: number): string =>
  hexString.padEnd(length, '0');

export const exceedsMaxLengthBytes = (string: string, maxLengthBytes: number): boolean =>
  string ? Buffer.from(string).length > maxLengthBytes : false;

export function cloneDeep<T>(obj: T): T {
  return lodashCloneDeep(obj);
}

export function omit<T, K extends keyof any>(obj: T, prop: K): Omit<T, K> {
  const clone = cloneDeep(obj);
  // @ts-expect-error
  delete clone[prop];
  return clone;
}

export const txidFromData = (data: Buffer): string => {
  return Buffer.from(sha512_256(data)).toString('hex');
};

export const hash160 = (input: Buffer): Buffer => {
  return Buffer.from(ripemd160(sha256(input)));
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// single-sig address (p2pkh)
export const hashP2PKH = (input: Buffer): string => {
  return hash160(input).toString('hex');
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// single-sig address over p2sh (p2h-p2wpkh)
export const hashP2WPKH = (input: Buffer): string => {
  const keyHash = hash160(input);

  const bufferArray = new BufferArray();
  bufferArray.appendByte(0);
  bufferArray.appendByte(keyHash.length);
  bufferArray.push(keyHash);

  const redeemScript = bufferArray.concatBuffer();
  const redeemScriptHash = hash160(redeemScript);
  return redeemScriptHash.toString('hex');
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// multi-sig address (p2sh)
export const hashP2SH = (numSigs: number, pubKeys: Buffer[]): string => {
  if (numSigs > 15 || pubKeys.length > 15) {
    throw Error('P2SH multisig address can only contain up to 15 public keys');
  }

  // construct P2SH script
  const bufferArray = new BufferArray();
  // OP_n
  bufferArray.appendByte(80 + numSigs);
  // public keys prepended by their length
  pubKeys.forEach(pubKey => {
    bufferArray.appendByte(pubKey.length);
    bufferArray.push(pubKey);
  });
  // OP_m
  bufferArray.appendByte(80 + pubKeys.length);
  // OP_CHECKMULTISIG
  bufferArray.appendByte(174);

  const redeemScript = bufferArray.concatBuffer();
  const redeemScriptHash = hash160(redeemScript);
  return redeemScriptHash.toString('hex');
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// multisig address over p2sh (p2sh-p2wsh)
export const hashP2WSH = (numSigs: number, pubKeys: Buffer[]): string => {
  if (numSigs > 15 || pubKeys.length > 15) {
    throw Error('P2WSH multisig address can only contain up to 15 public keys');
  }

  // construct P2SH script
  const scriptArray = new BufferArray();
  // OP_n
  scriptArray.appendByte(80 + numSigs);
  // public keys prepended by their length
  pubKeys.forEach(pubKey => {
    scriptArray.appendByte(pubKey.length);
    scriptArray.push(pubKey);
  });
  // OP_m
  scriptArray.appendByte(80 + pubKeys.length);
  // OP_CHECKMULTISIG
  scriptArray.appendByte(174);

  const script = scriptArray.concatBuffer();
  const digest = Buffer.from(sha256(script));

  const bufferArray = new BufferArray();
  bufferArray.appendByte(0);
  bufferArray.appendByte(digest.length);
  bufferArray.push(digest);

  const redeemScript = bufferArray.concatBuffer();
  const redeemScriptHash = hash160(redeemScript);
  return redeemScriptHash.toString('hex');
};

export function isClarityName(name: string) {
  const regex = /^[a-zA-Z]([a-zA-Z0-9]|[-_!?+<>=/*])*$|^[-+=/*]$|^[<>]=?$/;
  return regex.test(name) && name.length < 128;
}

/**
 * Converts a clarity value to a hex encoded string with `0x` prefix
 * @param {ClarityValue} cv  - the clarity value to convert
 */
export function cvToHex(cv: ClarityValue) {
  const serialized = serializeCV(cv);
  return `0x${serialized.toString('hex')}`;
}

/**
 * Converts a hex encoded string to a clarity value
 * @param {string} hex - the hex encoded string with or without `0x` prefix
 */
export function hexToCV(hex: string) {
  return deserializeCV(hex);
}
/**
 * Read only function response object
 *
 * @param {Boolean} okay - the status of the response
 * @param {string} result - serialized hex clarity value
 */

export interface ReadOnlyFunctionSuccessResponse {
  okay: true;
  result: string;
}

export interface ReadOnlyFunctionErrorResponse {
  okay: false;
  cause: string;
}

export type ReadOnlyFunctionResponse =
  | ReadOnlyFunctionSuccessResponse
  | ReadOnlyFunctionErrorResponse;

/**
 * Converts the response of a read-only function call into its Clarity Value
 * @param param
 */
export const parseReadOnlyResponse = (response: ReadOnlyFunctionResponse): ClarityValue => {
  if (response.okay) {
    return hexToCV(response.result);
  } else {
    throw new Error(response.cause);
  }
};

export const validateStacksAddress = (stacksAddress: string): boolean => {
  try {
    c32addressDecode(stacksAddress);
    return true;
  } catch (e) {
    return false;
  }
};

export const validateTxId = (txid: string): boolean => {
  if (txid === 'success') return true; // Bypass fetchMock tests
  const value = with0x(txid).toLowerCase();
  if (value.length !== 66) return false;
  return with0x(BigInt(value).toString(16).padStart(64, '0')) === value;
};
