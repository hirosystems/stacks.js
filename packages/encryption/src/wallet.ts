import { entropyToMnemonic, mnemonicToEntropy, validateMnemonic } from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';
import { bytesToHex, concatBytes, equals, hexToBytes } from '@stacks/common';
import { createCipher } from './aesCipher';
import { GetRandomBytes, randomBytes } from './cryptoRandom';
import { hmacSha256 } from './ec';
import { createPbkdf2 } from './pbkdf2';
import { createSha2Hash } from './sha2Hash';

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

  return concatBytes(salt, hmacDigest, cipherText);
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
 * Decrypt an encrypted mnemonic phrase with a password.
 * @param data - Bytes or hex-encoded string of the encrypted mnemonic
 * @param password - Password for data
 * @return {string} the raw mnemonic phrase
 * @ignore
 */
export async function decryptMnemonic(
  data: string | Uint8Array,
  password: string
): Promise<string> {
  const dataBytes = typeof data === 'string' ? hexToBytes(data) : data;
  return await decryptMnemonicBytes(dataBytes, password);
}
