import { Buffer } from '@stacks/common';
// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import { generateMnemonic as generateBip39Mnemonic, mnemonicToSeed } from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similiar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';
import { bip32 } from 'bitcoinjs-lib';

import { encrypt } from '../encryption/encrypt';
import { encryptMnemonic } from '@stacks/encryption';

export type AllowedKeyEntropyBits = 128 | 256;

export async function generateMnemonicRootKeychain(entropy: AllowedKeyEntropyBits) {
  const plaintextMnemonic = generateBip39Mnemonic(wordlist, entropy);
  const seed = await mnemonicToSeed(plaintextMnemonic);
  const rootNode = bip32.fromSeed(Buffer.from(seed));
  return {
    rootNode,
    plaintextMnemonic,
  };
}

export async function generateEncryptedMnemonicRootKeychain(
  password: string,
  entropy: AllowedKeyEntropyBits
) {
  const plaintextMnemonic = generateBip39Mnemonic(wordlist, entropy);
  const seed = await mnemonicToSeed(plaintextMnemonic);
  const rootNode = bip32.fromSeed(Buffer.from(seed));
  const ciphertextBuffer = await encrypt(plaintextMnemonic, password);
  const encryptedMnemonicPhrase = ciphertextBuffer.toString('hex');
  return {
    rootNode,
    encryptedMnemonicPhrase,
  };
}

export async function deriveRootKeychainFromMnemonic(plaintextMnemonic: string) {
  const seed = await mnemonicToSeed(plaintextMnemonic);
  const rootNode = bip32.fromSeed(Buffer.from(seed));
  return rootNode;
}

export async function encryptMnemonicFormatted(plaintextMnemonic: string, password: string) {
  const encryptedMnemonic = await encryptMnemonic(plaintextMnemonic, password);
  const encryptedMnemonicHex = encryptedMnemonic.toString('hex');
  return { encryptedMnemonic, encryptedMnemonicHex };
}
