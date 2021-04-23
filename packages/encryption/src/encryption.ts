import { Buffer } from '@stacks/common';
import {
  CipherTextEncoding,
  SignedCipherObject,
  encryptECIES,
  decryptECIES,
  signECDSA,
} from './ec';

import { getPublicKeyFromPrivate } from './keys';

export interface EncryptionOptions {
  /**
   * If set to `true` the data is signed using ECDSA on SHA256 hashes with the user's
   * app private key. If a string is specified, it is used as the private key instead
   * of the user's app private key.
   * @default false
   */
  sign?: boolean | string;
  /**
   * String encoding format for the cipherText buffer.
   * Currently defaults to 'hex' for legacy backwards-compatibility.
   * Only used if the `encrypt` option is also used.
   * Note: in the future this should default to 'base64' for the significant
   * file size reduction.
   */
  cipherTextEncoding?: CipherTextEncoding;
  /**
   * Specifies if the original unencrypted content is a ASCII or UTF-8 string.
   * For example stringified JSON.
   * If true, then when the ciphertext is decrypted, it will be returned as
   * a `string` type variable, otherwise will be returned as a Buffer.
   */
  wasString?: boolean;
}

/**
 * Specify encryption options, and whether to sign the ciphertext.
 */
export interface EncryptContentOptions extends EncryptionOptions {
  /**
   * Encrypt the data with this key.
   */
  publicKey?: string;
  /**
   * Encrypt the data with the public key corresponding to the supplied private key
   */
  privateKey?: string;
}

/**
 * Encrypts the data provided with the app public key.
 * @param {String|Buffer} content - data to encrypt
 * @param {Object} [options=null] - options object
 * @param {String} options.publicKey - the hex string of the ECDSA public
 * key to use for encryption. If not provided, will use user's appPublicKey.
 * @return {String} Stringified ciphertext object
 */
export async function encryptContent(
  content: string | Buffer,
  options?: EncryptContentOptions
): Promise<string> {
  const opts = Object.assign({}, options);
  let privateKey: string | undefined;
  if (!opts.publicKey) {
    if (!opts.privateKey) {
      throw new Error('Either public key or private key must be supplied for encryption.');
    }
    opts.publicKey = getPublicKeyFromPrivate(opts.privateKey);
  }
  let wasString: boolean;
  if (typeof opts.wasString === 'boolean') {
    wasString = opts.wasString;
  } else {
    wasString = typeof content === 'string';
  }
  const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content;
  const cipherObject = await encryptECIES(
    opts.publicKey,
    contentBuffer,
    wasString,
    opts.cipherTextEncoding
  );
  let cipherPayload = JSON.stringify(cipherObject);
  if (opts.sign) {
    if (typeof opts.sign === 'string') {
      privateKey = opts.sign;
    } else if (!privateKey) {
      privateKey = opts.privateKey;
    }
    const signatureObject = signECDSA(privateKey!, cipherPayload);
    const signedCipherObject: SignedCipherObject = {
      signature: signatureObject.signature,
      publicKey: signatureObject.publicKey,
      cipherText: cipherPayload,
    };
    cipherPayload = JSON.stringify(signedCipherObject);
  }
  return cipherPayload;
}

/**
 * Decrypts data encrypted with `encryptContent` with the
 * transit private key.
 * @param {String|Buffer} content - encrypted content.
 * @param {Object} [options=null] - options object
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key to use for decryption. If not provided, will use user's appPrivateKey.
 * @return {String|Buffer} decrypted content.
 */
export function decryptContent(
  content: string,
  options?: {
    privateKey?: string;
  }
): Promise<string | Buffer> {
  const opts = Object.assign({}, options);
  if (!opts.privateKey) {
    throw new Error('Private key is required for decryption.');
  }

  try {
    const cipherObject = JSON.parse(content);
    return decryptECIES(opts.privateKey, cipherObject);
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        'Failed to parse encrypted content JSON. The content may not ' +
          'be encrypted. If using getFile, try passing { decrypt: false }.'
      );
    } else {
      throw err;
    }
  }
}
