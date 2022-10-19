// https://github.com/paulmillr/scure-bip39
// Secure, audited & minimal implementation of BIP39 mnemonic phrases.
import { generateMnemonic, mnemonicToSeed } from '@scure/bip39';
// Word lists not imported by default as that would increase bundle sizes too much as in case of bitcoinjs/bip39
// Use default english world list similiar to bitcoinjs/bip39
// Backward compatible with bitcoinjs/bip39 dependency
// Very small in size as compared to bitcoinjs/bip39 wordlist
// Reference: https://github.com/paulmillr/scure-bip39
import { wordlist } from '@scure/bip39/wordlists/english';

// https://github.com/paulmillr/scure-bip32
// Secure, audited & minimal implementation of BIP32 hierarchical deterministic (HD) wallets.
import { HDKey } from '@scure/bip32';
import { Wallet, getRootNode } from './models/common';
import { encrypt } from './encryption';
import { deriveAccount, deriveWalletKeys } from './derive';
import { DerivationType } from '.';
import { bytesToHex } from '@stacks/common';

export type AllowedKeyEntropyBits = 128 | 256;

export const generateSecretKey = (entropy: AllowedKeyEntropyBits = 256) => {
  const secretKey = generateMnemonic(wordlist, entropy);
  return secretKey;
};

/**
 * Generate a new [[Wallet]].
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
  const ciphertextBytes = await encrypt(secretKey, password);
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
