// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import { validateMnemonic, mnemonicToEntropy, entropyToMnemonic } from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similiar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';
import { randomBytes, GetRandomBytes } from './cryptoRandom';
import { createSha2Hash } from './sha2Hash';
import { createCipher } from './aesCipher';
import { createPbkdf2 } from './pbkdf2';
import { TriplesecDecryptSignature } from './cryptoUtils';
import {
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  equals,
  hexToBytes,
  utf8ToBytes,
} from '@stacks/common';
import { hmacSha256 } from './ec';

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Uint8Array>} The encrypted phrase
 * @ignore
 * */
export async function encryptMnemonic(
  phrase: string,
  password: string,
  opts?: {
    getRandomBytes?: GetRandomBytes;
  }
): Promise<Uint8Array> {
  // hex encoded mnemonic string
  let mnemonicEntropy: string;
  try {
    // must be bip39 mnemonic
    // `mnemonicToEntropy` converts mnemonic string to raw entropy in form of byte array
    const entropyBytes = mnemonicToEntropy(phrase, wordlist);
    // Convert byte array to hex string
    mnemonicEntropy = bytesToHex(entropyBytes);
  } catch (error) {
    console.error('Invalid mnemonic phrase provided');
    console.error(error);
    throw new Error('Not a valid bip39 mnemonic');
  }

  // normalize plaintext to fixed length byte string
  const plaintextNormalized = hexToBytes(mnemonicEntropy);

  // AES-128-CBC with SHA256 HMAC
  const pbkdf2 = await createPbkdf2();
  const salt = opts?.getRandomBytes ? opts.getRandomBytes(16) : randomBytes(16);
  const keysAndIV = await pbkdf2.derive(password, salt, 100_000, 48, 'sha512');
  const encKey = keysAndIV.slice(0, 16);
  const macKey = keysAndIV.slice(16, 32);
  const iv = keysAndIV.slice(32, 48);

  const cipher = await createCipher();
  const cipherText = await cipher.encrypt('aes-128-cbc', encKey, iv, plaintextNormalized);

  const hmacPayload = concatBytes(salt, cipherText);
  const hmacDigest = hmacSha256(macKey, hmacPayload);

  const payload = concatBytes(salt, hmacDigest, cipherText);
  return payload;
}

// Used to distinguish bad password during decrypt vs invalid format
class PasswordError extends Error {}

/**
 * @ignore
 */
async function decryptMnemonicBytes(dataBytes: Uint8Array, password: string): Promise<string> {
  const salt = dataBytes.slice(0, 16);
  const hmacSig = dataBytes.slice(16, 48); // 32 bytes
  const cipherText = dataBytes.slice(48);
  const hmacPayload = concatBytes(salt, cipherText);

  const pbkdf2 = await createPbkdf2();
  const keysAndIV = await pbkdf2.derive(password, salt, 100000, 48, 'sha512');
  const encKey = keysAndIV.slice(0, 16);
  const macKey = keysAndIV.slice(16, 32);
  const iv = keysAndIV.slice(32, 48);

  const decipher = await createCipher();
  const decryptedResult = await decipher.decrypt('aes-128-cbc', encKey, iv, cipherText);

  const hmacDigest = hmacSha256(macKey, hmacPayload);

  // hash both hmacSig and hmacDigest so string comparison time
  // is uncorrelated to the ciphertext
  const sha2Hash = await createSha2Hash();
  const hmacSigHash = await sha2Hash.digest(hmacSig);
  const hmacDigestHash = await sha2Hash.digest(hmacDigest);

  if (!equals(hmacSigHash, hmacDigestHash)) {
    // not authentic
    throw new PasswordError('Wrong password (HMAC mismatch)');
  }

  let mnemonic: string;
  try {
    // Converts raw entropy in form of byte array to mnemonic string
    mnemonic = entropyToMnemonic(decryptedResult, wordlist);
  } catch (error) {
    console.error('Error thrown by `entropyToMnemonic`');
    console.error(error);
    throw new PasswordError('Wrong password (invalid plaintext)');
  }
  // Validates mnemonic for being 12-24 words contained in `wordlist`
  if (!validateMnemonic(mnemonic, wordlist)) {
    throw new PasswordError('Wrong password (invalid plaintext)');
  }

  return mnemonic;
}

/**
 * Decrypt legacy triplesec keys
 * @param {Uint8Array} dataBytes - The encrypted key
 * @param {String} password - Password for data
 * @return {Promise<BuUint8Arrayffer>} Decrypted seed
 * @ignore
 */
function decryptLegacy(
  dataBytes: Uint8Array,
  password: string,
  triplesecDecrypt?: TriplesecDecryptSignature
): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    if (!triplesecDecrypt) {
      reject(new Error('The `triplesec.decrypt` function must be provided'));
    }
    triplesecDecrypt!(
      {
        key: utf8ToBytes(password),
        data: dataBytes,
      },
      (err, plaintextBytes) => {
        if (!err) {
          resolve(plaintextBytes!);
        } else {
          reject(err);
        }
      }
    );
  });
}

/**
 * Decrypt an encrypted mnemonic phrase with a password.
 * Legacy triplesec encrypted payloads are also supported.
 * @param data - Bytes or hex-encoded string of the encrypted mnemonic
 * @param password - Password for data
 * @return {string} the raw mnemonic phrase
 * @ignore
 */
export async function decryptMnemonic(
  data: string | Uint8Array,
  password: string,
  triplesecDecrypt?: TriplesecDecryptSignature
): Promise<string> {
  const dataBytes = typeof data === 'string' ? hexToBytes(data) : data;
  try {
    return await decryptMnemonicBytes(dataBytes, password);
  } catch (error) {
    if (error instanceof PasswordError) throw error;
    const data = await decryptLegacy(dataBytes, password, triplesecDecrypt);
    return bytesToUtf8(data);
  }
}
