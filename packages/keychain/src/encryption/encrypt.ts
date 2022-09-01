import { encryptMnemonic } from '@stacks/encryption';

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param phrase - Raw mnemonic phrase
 * @param password - Password to encrypt mnemonic with
 * @return The encrypted phrase
 * @deprecated use `encrypt` from `@stacks/wallet-sdk` instead
 * */
export async function encrypt(phrase: string, password: string) {
  const result = await encryptMnemonic(phrase, password);
  return result;
}
