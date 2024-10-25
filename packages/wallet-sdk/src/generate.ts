// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';

// https://github.com/paulmillr/scure-bip32
// Secure, audited & minimal implementation of BIP32 hierarchical deterministic (HD) wallets.
import { HDKey } from '@scure/bip32';
import { bytesToHex } from '@stacks/common';
import { encryptMnemonic } from '@stacks/encryption';
import { DerivationType } from '.';
import { deriveAccount, deriveWalletKeys } from './derive';
import { Wallet, getRootNode } from './models/common';

export type AllowedKeyEntropyBits = 128 | 256;

/**
 * Generate a random 12 or 24 word mnemonic phrase.
 *
 * @example
 * ```ts
 * const phrase = randomSeedPhrase();
 * // "warrior volume sport ... figure cake since"
 * ```
 */
export function randomSeedPhrase(entropy: AllowedKeyEntropyBits = 256): string {
  return generateMnemonic(wordlist, entropy);
}

/** @deprecated Use {@link randomSeedPhrase} instead */
export const generateSecretKey = randomSeedPhrase;

/**
 * Generate a new {@link Wallet}.
 * @param secretKey A 12 or 24 word mnemonic phrase. Must be a valid bip39 mnemonic.
 * @param password A password used to encrypt the wallet
 */
export const generateWallet = async ({
  secretKey,
  password,
}: {
  secretKey: string;
  password: string;
}): Promise<Wallet> => {
  const ciphertextBytes = await encryptMnemonic(secretKey, password);
  const encryptedSecretKey = bytesToHex(ciphertextBytes);

  const rootPrivateKey = await mnemonicToSeed(secretKey);
  const rootNode = HDKey.fromMasterSeed(rootPrivateKey);
  const walletKeys = await deriveWalletKeys(rootNode);

  const wallet = {
    ...walletKeys,
    encryptedSecretKey,
    accounts: [],
    config: {
      accounts: [],
    },
  };

  return generateNewAccount(wallet);
};

export const generateNewAccount = (wallet: Wallet) => {
  const accountIndex = wallet.accounts.length;
  const newAccount = deriveAccount({
    rootNode: getRootNode(wallet),
    index: accountIndex,
    salt: wallet.salt,
    stxDerivationType: DerivationType.Wallet,
  });

  return {
    ...wallet,
    accounts: [...wallet.accounts, newAccount],
  };
};
