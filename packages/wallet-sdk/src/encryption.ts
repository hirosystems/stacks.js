import { decryptMnemonic, encryptMnemonic } from '@stacks/encryption';

/**
 * Decrypt an encrypted mnemonic phrase with a password.
 * @param data - Uint8Array or hex-encoded string of the encrypted mnemonic
 * @param password - Password for data
 * @return the raw mnemonic phrase
 */
export function decrypt(dataBytes: Uint8Array | string, password: string): Promise<string> {
  return decryptMnemonic(dataBytes, password);
}

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param phrase - Raw mnemonic phrase
 * @param password - Password to encrypt mnemonic with
 * @return The encrypted phrase
 * */
export function encrypt(phrase: string, password: string): Promise<Uint8Array> {
  return encryptMnemonic(phrase, password);
}
