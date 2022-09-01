// @ts-ignore
import { Buffer } from '@stacks/common';
import { decrypt as triplesecDecrypt } from 'triplesec';
import { decryptMnemonic } from '@stacks/encryption';

/**
 * Decrypt an encrypted mnemonic phrase with a password.
 * Legacy triplesec encrypted payloads are also supported.
 * @param data - Buffer or hex-encoded string of the encrypted mnemonic
 * @param password - Password for data
 * @return the raw mnemonic phrase
 * @deprecated use `decrypt` from `@stacks/wallet-sdk` instead
 */
export async function decrypt(dataBuffer: Buffer | string, password: string): Promise<string> {
  const result = await decryptMnemonic(dataBuffer, password, triplesecDecrypt);
  return result;
}
