import { Buffer } from '@stacks/common';
import { validateMnemonic, mnemonicToEntropy, entropyToMnemonic } from 'bip39';
import { randomBytes, GetRandomBytes } from './cryptoRandom';
import { createSha2Hash } from './sha2Hash';
import { createHmacSha256 } from './hmacSha256';
import { createCipher } from './aesCipher';
import { createPbkdf2 } from './pbkdf2';
import { TriplesecDecryptSignature } from './cryptoUtils';

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 * @private
 * @ignore
 * */
export async function encryptMnemonic(
  phrase: string,
  password: string,
  opts?: {
    getRandomBytes?: GetRandomBytes;
  }
): Promise<Buffer> {
  // hex encoded mnemonic string
  let mnemonicEntropy: string;
  try {
    // must be bip39 mnemonic
    mnemonicEntropy = mnemonicToEntropy(phrase);
  } catch (error) {
    console.error('Invalid mnemonic phrase provided');
    console.error(error);
    throw new Error('Not a valid bip39 mnemonic');
  }

  // normalize plaintext to fixed length byte string
  const plaintextNormalized = Buffer.from(mnemonicEntropy, 'hex');

  // AES-128-CBC with SHA256 HMAC
  const pbkdf2 = await createPbkdf2();
  let salt: Buffer;
  if (opts && opts.getRandomBytes) {
    salt = opts.getRandomBytes(16);
  } else {
    salt = randomBytes(16);
  }
  const keysAndIV = await pbkdf2.derive(password, salt, 100000, 48, 'sha512');
  const encKey = keysAndIV.slice(0, 16);
  const macKey = keysAndIV.slice(16, 32);
  const iv = keysAndIV.slice(32, 48);

  const cipher = await createCipher();
  const cipherText = await cipher.encrypt('aes-128-cbc', encKey, iv, plaintextNormalized);

  const hmacPayload = Buffer.concat([salt, cipherText]);
  const hmacSha256 = await createHmacSha256();
  const hmacDigest = await hmacSha256.digest(macKey, hmacPayload);

  const payload = Buffer.concat([salt, hmacDigest, cipherText]);
  return payload;
}

// Used to distinguish bad password during decrypt vs invalid format
class PasswordError extends Error {}

/**
 * @ignore
 */
async function decryptMnemonicBuffer(dataBuffer: Buffer, password: string): Promise<string> {
  const salt = dataBuffer.slice(0, 16);
  const hmacSig = dataBuffer.slice(16, 48); // 32 bytes
  const cipherText = dataBuffer.slice(48);
  const hmacPayload = Buffer.concat([salt, cipherText]);

  const pbkdf2 = await createPbkdf2();
  const keysAndIV = await pbkdf2.derive(password, salt, 100000, 48, 'sha512');
  const encKey = keysAndIV.slice(0, 16);
  const macKey = keysAndIV.slice(16, 32);
  const iv = keysAndIV.slice(32, 48);

  const decipher = await createCipher();
  const decryptedResult = await decipher.decrypt('aes-128-cbc', encKey, iv, cipherText);

  const hmacSha256 = await createHmacSha256();
  const hmacDigest = await hmacSha256.digest(macKey, hmacPayload);

  // hash both hmacSig and hmacDigest so string comparison time
  // is uncorrelated to the ciphertext
  const sha2Hash = await createSha2Hash();
  const hmacSigHash = await sha2Hash.digest(hmacSig);
  const hmacDigestHash = await sha2Hash.digest(hmacDigest);

  if (!hmacSigHash.equals(hmacDigestHash)) {
    // not authentic
    throw new PasswordError('Wrong password (HMAC mismatch)');
  }

  let mnemonic: string;
  try {
    mnemonic = entropyToMnemonic(decryptedResult);
  } catch (error) {
    console.error('Error thrown by `entropyToMnemonic`');
    console.error(error);
    throw new PasswordError('Wrong password (invalid plaintext)');
  }
  if (!validateMnemonic(mnemonic)) {
    throw new PasswordError('Wrong password (invalid plaintext)');
  }

  return mnemonic;
}

/**
 * Decrypt legacy triplesec keys
 * @param {Buffer} dataBuffer - The encrypted key
 * @param {String} password - Password for data
 * @return {Promise<Buffer>} Decrypted seed
 * @private
 * @ignore
 */
function decryptLegacy(
  dataBuffer: Buffer,
  password: string,
  triplesecDecrypt?: TriplesecDecryptSignature
): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    if (!triplesecDecrypt) {
      reject(new Error('The `triplesec.decrypt` function must be provided'));
    }
    triplesecDecrypt!(
      {
        key: Buffer.from(password),
        data: dataBuffer,
      },
      (err, plaintextBuffer) => {
        if (!err) {
          resolve(plaintextBuffer!);
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
 * @param data - Buffer or hex-encoded string of the encrypted mnemonic
 * @param password - Password for data
 * @return the raw mnemonic phrase
 * @private
 * @ignore
 */
export async function decryptMnemonic(
  data: string | Buffer,
  password: string,
  triplesecDecrypt?: TriplesecDecryptSignature
) {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex');
  try {
    return await decryptMnemonicBuffer(dataBuffer, password);
  } catch (err) {
    if (err instanceof PasswordError) {
      throw err;
    }
    const data = await decryptLegacy(dataBuffer, password, triplesecDecrypt);
    return data.toString();
  }
}
