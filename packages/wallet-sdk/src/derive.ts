import { BIP32Interface } from 'bip32';
import { Buffer, ChainID, TransactionVersion } from '@stacks/common';
import { ECPair } from 'bitcoinjs-lib';
import { createSha2Hash, ecPairToHexString } from '@stacks/encryption';

import { assertIsTruthy, whenChainId } from './utils';
import { Account, WalletKeys } from './models/common';
import { StacksNetwork } from '@stacks/network';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { fetchFirstName } from './usernames';

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

/**
 * Determines how a private key is derived for an account:
 *
 * Wallet => STX_DERIVATION_PATH
 * Data => DATA_DERIVATION_PATH
 */
export enum DerivationType {
  Wallet,
  Data,
  Unknown,
}

/**
 * Tries to find a derivation path for the stxPrivateKey for the account
 * defined by rootNode and index that respects the username of that account
 * and that respects the given derivationType.
 *
 * The stxPrivateKey is used to sign the profile of the account, therefore,
 * a username must be owned by the stxPrivateKey.
 *
 * If a username is provided, a lookup for the owner address
 * on the provided network is done.
 *
 * If no username is provided, a lookup for names owned
 * by the stx derivation path and by the data derivation path is done.
 *
 * If derivationType other than Unknown is given this derivation type is enforced.
 *
 * @param selectionOptions
 * @returns username and derivation type
 */
export const selectStxDerivation = async ({
  username,
  rootNode,
  index,
  network,
}: {
  username?: string;
  rootNode: BIP32Interface;
  index: number;
  network?: StacksNetwork;
}): Promise<{ username: string | undefined; stxDerivationType: DerivationType }> => {
  if (username) {
    // Based on username, determine the derivation path for the stx private key
    const stxDerivationTypeForUsername = await selectDerivationTypeForUsername({
      username,
      rootNode,
      index,
      network,
    });
    return { username, stxDerivationType: stxDerivationTypeForUsername };
  } else {
    const { username, derivationType } = await selectUsernameForAccount({
      rootNode,
      index,
      network,
    });
    return { username, stxDerivationType: derivationType };
  }
};

const selectDerivationTypeForUsername = async ({
  username,
  rootNode,
  index,
  network,
}: {
  username: string;
  rootNode: BIP32Interface;
  index: number;
  network?: StacksNetwork;
}): Promise<DerivationType> => {
  if (network) {
    const nameInfo = await network.getNameInfo(username);
    let stxPrivateKey = deriveStxPrivateKey({ rootNode, index });
    let derivedAddress = getAddressFromPrivateKey(stxPrivateKey);
    if (derivedAddress !== nameInfo.address) {
      // try data private key
      stxPrivateKey = deriveDataPrivateKey({
        rootNode,
        index,
      });
      derivedAddress = getAddressFromPrivateKey(stxPrivateKey);
      if (derivedAddress !== nameInfo.address) {
        return DerivationType.Unknown;
      } else {
        return DerivationType.Data;
      }
    } else {
      return DerivationType.Wallet;
    }
  } else {
    // no network to determine the derivation path
    return DerivationType.Unknown;
  }
};

const selectUsernameForAccount = async ({
  rootNode,
  index,
  network,
}: {
  rootNode: BIP32Interface;
  index: number;
  network?: StacksNetwork;
}): Promise<{ username: string | undefined; derivationType: DerivationType }> => {
  // try to find existing usernames owned by stx derivation path
  if (network) {
    const txVersion = whenChainId(network.chainId)({
      [ChainID.Mainnet]: TransactionVersion.Mainnet,
      [ChainID.Testnet]: TransactionVersion.Testnet,
    });
    const stxPrivateKey = deriveStxPrivateKey({ rootNode, index });
    const address = getAddressFromPrivateKey(stxPrivateKey, txVersion);
    let username = await fetchFirstName(address, network);
    if (username) {
      return { username, derivationType: DerivationType.Wallet };
    } else {
      // try to find existing usernames owned by data derivation path
      const dataPrivateKey = deriveDataPrivateKey({ rootNode, index });
      const address = getAddressFromPrivateKey(dataPrivateKey, txVersion);
      username = await fetchFirstName(address, network);
      if (username) {
        return { username, derivationType: DerivationType.Data };
      }
    }
  }
  // use wallet derivation for accounts without username
  // or without network parameter (offline)
  return { username: undefined, derivationType: DerivationType.Wallet };
};

export const fetchUsernameForAccountByDerivationType = async ({
  rootNode,
  index,
  derivationType,
  network,
}: {
  rootNode: BIP32Interface;
  index: number;
  derivationType: DerivationType.Wallet | DerivationType.Data;
  network?: StacksNetwork;
}): Promise<{
  username: string | undefined;
}> => {
  // try to find existing usernames owned by given derivation path
  if (network) {
    const txVersion = whenChainId(network.chainId)({
      [ChainID.Mainnet]: TransactionVersion.Mainnet,
      [ChainID.Testnet]: TransactionVersion.Testnet,
    });
    const privateKey = derivePrivateKeyByType({ rootNode, index, derivationType });
    const address = getAddressFromPrivateKey(privateKey, txVersion);
    const username = await fetchFirstName(address, network);
    return { username };
  } else {
    return { username: undefined };
  }
};

export const derivePrivateKeyByType = ({
  rootNode,
  index,
  derivationType,
}: {
  rootNode: BIP32Interface;
  index: number;
  derivationType: DerivationType;
}): string => {
  return derivationType === DerivationType.Wallet
    ? deriveStxPrivateKey({ rootNode, index })
    : deriveDataPrivateKey({ rootNode, index });
};

export const deriveStxPrivateKey = ({
  rootNode,
  index,
}: {
  rootNode: BIP32Interface;
  index: number;
}) => {
  const childKey = rootNode.derivePath(STX_DERIVATION_PATH).derive(index);
  assertIsTruthy(childKey.privateKey);
  const ecPair = ECPair.fromPrivateKey(childKey.privateKey);
  return ecPairToHexString(ecPair);
};

export const deriveDataPrivateKey = ({
  rootNode,
  index,
}: {
  rootNode: BIP32Interface;
  index: number;
}) => {
  const childKey = rootNode.derivePath(DATA_DERIVATION_PATH).deriveHardened(index);
  assertIsTruthy(childKey.privateKey);
  const ecPair = ECPair.fromPrivateKey(childKey.privateKey);
  return ecPairToHexString(ecPair);
};

export const deriveAccount = ({
  rootNode,
  index,
  salt,
  stxDerivationType,
}: {
  rootNode: BIP32Interface;
  index: number;
  salt: string;
  stxDerivationType: DerivationType.Wallet | DerivationType.Data;
}): Account => {
  const stxPrivateKey =
    stxDerivationType === DerivationType.Wallet
      ? deriveStxPrivateKey({ rootNode, index })
      : deriveDataPrivateKey({ rootNode, index });
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
