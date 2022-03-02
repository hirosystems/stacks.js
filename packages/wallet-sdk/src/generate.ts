import { generateMnemonic, mnemonicToSeed } from 'bip39';
import { fromSeed } from 'bip32';
import { randomBytes } from '@stacks/encryption';
import { Wallet, getRootNode } from './models/common';
import { encrypt } from './encryption';
import { deriveAccount, deriveWalletKeys } from './derive';
import { DerivationType } from '.';

export type AllowedKeyEntropyBits = 128 | 256;

export const generateSecretKey = (entropy: AllowedKeyEntropyBits = 256) => {
  const secretKey = generateMnemonic(entropy, randomBytes);
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
  const ciphertextBuffer = await encrypt(secretKey, password);
  const encryptedSecretKey = ciphertextBuffer.toString('hex');

  const rootPrivateKey = await mnemonicToSeed(secretKey);
  const rootNode = fromSeed(rootPrivateKey);
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
