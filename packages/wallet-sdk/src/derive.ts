import { BIP32Interface } from 'bip32';
import { Buffer } from '@stacks/common';
import { ECPair } from 'bitcoinjs-lib';
import { createSha2Hash, ecPairToHexString } from '@stacks/encryption';

import { assertIsTruthy } from './utils';
import { Account } from './models/common';
import { WalletKeys } from './models/common';

const DATA_DERIVATION_PATH = `m/888'/0'`;
const WALLET_CONFIG_PATH = `m/44/5757'/0'/1`;
const STX_DERIVATION_PATH = `m/44'/5757'/0'/0`;

export const deriveWalletKeys = async (rootNode: BIP32Interface): Promise<WalletKeys> => {
  assertIsTruthy(rootNode.privateKey);
  const derived: WalletKeys = {
    salt: await deriveSalt(rootNode),
    rootKey: rootNode.toBase58(),
    configPrivateKey: deriveConfigPrivateKey(rootNode).toString('hex'),
  };
  return derived;
};

/**
 * Derive the `configPrivateKey` for a wallet.
 *
 * This key is derived from the path `m/5757'/0'/1`, using `1` for change option, following the bip44 recommendation
 * for keys relating to non-public data.
 *
 * This key is used to encrypt configuration data related to a wallet, so the user's
 * configuration can be synced across wallets.
 *
 * @param rootNode A keychain that was created using the wallet's seed phrase
 */
export const deriveConfigPrivateKey = (rootNode: BIP32Interface): Buffer => {
  const derivedConfigKey = rootNode.derivePath(WALLET_CONFIG_PATH).privateKey;
  if (!derivedConfigKey) {
    throw new TypeError('Unable to derive config key for wallet identities');
  }
  return derivedConfigKey;
};

/**
 * Before the Stacks Wallet, the authenticator used with Connect used a different format
 * and path for the config file.
 *
 * The path for this key is `m/45'`
 * @param rootNode A keychain that was created using the wallet's seed phrase
 */
export const deriveLegacyConfigPrivateKey = (rootNode: BIP32Interface): string => {
  const derivedLegacyKey = rootNode.deriveHardened(45).privateKey;
  if (!derivedLegacyKey) {
    throw new TypeError('Unable to derive config key for wallet identities');
  }
  const configPrivateKey = derivedLegacyKey.toString('hex');
  return configPrivateKey;
};

/**
 * Generate a salt, which is used for generating an app-specific private key
 * @param rootNode
 */
export const deriveSalt = async (rootNode: BIP32Interface) => {
  const identitiesKeychain = rootNode.derivePath(DATA_DERIVATION_PATH);
  const publicKeyHex = Buffer.from(identitiesKeychain.publicKey.toString('hex'));

  const sha2Hash = await createSha2Hash();
  const saltData = await sha2Hash.digest(publicKeyHex, 'sha256');
  const salt = saltData.toString('hex');

  return salt;
};

export const deriveAccount = ({
  rootNode,
  index,
  salt,
}: {
  rootNode: BIP32Interface;
  index: number;
  salt: string;
}): Account => {
  const childKey = rootNode.derivePath(STX_DERIVATION_PATH).derive(index);
  assertIsTruthy(childKey.privateKey);
  const ecPair = ECPair.fromPrivateKey(childKey.privateKey);
  const stxPrivateKey = ecPairToHexString(ecPair);
  const identitiesKeychain = rootNode.derivePath(DATA_DERIVATION_PATH);

  const identityKeychain = identitiesKeychain.deriveHardened(index);
  if (!identityKeychain.privateKey) throw new Error('Must have private key to derive identities');
  const dataPrivateKey = identityKeychain.privateKey.toString('hex');

  const appsKey = identityKeychain.deriveHardened(0).toBase58();

  return {
    stxPrivateKey,
    dataPrivateKey,
    appsKey,
    salt,
    index,
  };
};
