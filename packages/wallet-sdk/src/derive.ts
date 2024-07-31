// https://github.com/paulmillr/scure-bip32
// Secure, audited & minimal implementation of BIP32 hierarchical deterministic (HD) wallets.
import { HDKey } from '@scure/bip32';
import { getNameInfo } from '@stacks/auth';
import { ApiParam, bytesToHex, defaultApiLike, utf8ToBytes } from '@stacks/common';
import { compressPrivateKey, createSha2Hash } from '@stacks/encryption';
import {
  STACKS_MAINNET,
  StacksNetwork,
  StacksNetworkName,
  deriveDefaultUrl,
  networkFrom,
} from '@stacks/network';
import { getAddressFromPrivateKey } from '@stacks/transactions';
import { Account, HARDENED_OFFSET, WalletKeys } from './models/common';
import { fetchFirstName } from './usernames';
import { assertIsTruthy } from './utils';

const DATA_DERIVATION_PATH = `m/888'/0'`;
const WALLET_CONFIG_PATH = `m/44/5757'/0'/1`;
const STX_DERIVATION_PATH = `m/44'/5757'/0'/0`;

export const deriveWalletKeys = async (rootNode: HDKey): Promise<WalletKeys> => {
  assertIsTruthy(rootNode.privateKey);
  return {
    salt: await deriveSalt(rootNode),
    rootKey: rootNode.privateExtendedKey,
    configPrivateKey: bytesToHex(deriveConfigPrivateKey(rootNode)),
  };
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
export const deriveConfigPrivateKey = (rootNode: HDKey): Uint8Array => {
  const derivedConfigKey = rootNode.derive(WALLET_CONFIG_PATH).privateKey;
  if (!derivedConfigKey) throw new TypeError('Unable to derive config key for wallet identities');
  return derivedConfigKey;
};

/**
 * Before the Stacks Wallet, the authenticator used with Connect used a different format
 * and path for the config file.
 *
 * The path for this key is `m/45'`
 * @param rootNode A keychain that was created using the wallet's seed phrase
 */
export const deriveLegacyConfigPrivateKey = (rootNode: HDKey): string => {
  const derivedLegacyKey = rootNode.deriveChild(45 + HARDENED_OFFSET).privateKey;
  if (!derivedLegacyKey) throw new TypeError('Unable to derive config key for wallet identities');
  return bytesToHex(derivedLegacyKey);
};

/**
 * Generate a salt, which is used for generating an app-specific private key
 * @param rootNode
 */
export const deriveSalt = async (rootNode: HDKey) => {
  const identitiesKeychain = rootNode.derive(DATA_DERIVATION_PATH);
  const publicKeyHex = utf8ToBytes(bytesToHex(identitiesKeychain.publicKey as Uint8Array));

  const sha2Hash = await createSha2Hash();
  const saltData = await sha2Hash.digest(publicKeyHex, 'sha256');

  return bytesToHex(saltData);
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
  rootNode: HDKey;
  index: number;
  network?: StacksNetworkName | StacksNetwork;
}): Promise<{ username: string | undefined; stxDerivationType: DerivationType }> => {
  if (network) network = networkFrom(network);

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

/** @internal @ignore */
const selectDerivationTypeForUsername = async ({
  username,
  rootNode,
  index,
  network,
}: {
  username: string;
  rootNode: HDKey;
  index: number;
  network?: StacksNetwork;
}): Promise<DerivationType> => {
  if (network) {
    const nameInfo = await getNameInfo({ name: username });
    const stxPrivateKey = deriveStxPrivateKey({ rootNode, index });
    let derivedAddress = getAddressFromPrivateKey(stxPrivateKey);
    if (derivedAddress !== nameInfo.address) {
      // try data private key
      const dataPrivateKey = deriveDataPrivateKey({
        rootNode,
        index,
      });
      derivedAddress = getAddressFromPrivateKey(dataPrivateKey);
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

/** @internal @ignore */
const selectUsernameForAccount = async (
  opts: {
    rootNode: HDKey;
    index: number;
    network?: StacksNetwork;
  } & ApiParam
): Promise<{ username: string | undefined; derivationType: DerivationType }> => {
  const api = defaultApiLike({ ...{ url: deriveDefaultUrl(opts.network) }, ...opts.api });

  // try to find existing usernames owned by stx derivation path
  if (opts.network) {
    const stxPrivateKey = deriveStxPrivateKey(opts);
    const address = getAddressFromPrivateKey(stxPrivateKey, opts.network);
    let username = await fetchFirstName({ address, api });
    if (username) {
      return { username, derivationType: DerivationType.Wallet };
    } else {
      // try to find existing usernames owned by data derivation path
      const dataPrivateKey = deriveDataPrivateKey(opts);
      const address = getAddressFromPrivateKey(dataPrivateKey, opts.network);
      username = await fetchFirstName({ address, api });
      if (username) {
        return { username, derivationType: DerivationType.Data };
      }
    }
  }
  // use wallet derivation for accounts without username
  // or without network parameter (offline)
  return { username: undefined, derivationType: DerivationType.Wallet };
};

export const fetchUsernameForAccountByDerivationType = async (
  opts: {
    rootNode: HDKey;
    index: number;
    derivationType: DerivationType.Wallet | DerivationType.Data;
    network?: StacksNetworkName | StacksNetwork;
  } & ApiParam
): Promise<{
  username: string | undefined;
}> => {
  const api = defaultApiLike({ ...{ url: deriveDefaultUrl(opts.network) }, ...opts.api });

  // try to find existing usernames owned by given derivation path
  const selectedNetwork = opts.network ? networkFrom(opts.network) : STACKS_MAINNET;
  const privateKey = derivePrivateKeyByType(opts);
  const address = getAddressFromPrivateKey(privateKey, selectedNetwork);
  const username = await fetchFirstName({ address, api });
  return { username };
};

export const derivePrivateKeyByType = ({
  rootNode,
  index,
  derivationType,
}: {
  rootNode: HDKey;
  index: number;
  derivationType: DerivationType;
}): string => {
  return derivationType === DerivationType.Wallet
    ? deriveStxPrivateKey({ rootNode, index })
    : deriveDataPrivateKey({ rootNode, index });
};

export const deriveStxPrivateKey = ({ rootNode, index }: { rootNode: HDKey; index: number }) => {
  const childKey = rootNode.derive(STX_DERIVATION_PATH).deriveChild(index);
  assertIsTruthy(childKey.privateKey);
  return compressPrivateKey(childKey.privateKey);
};

export const deriveDataPrivateKey = ({ rootNode, index }: { rootNode: HDKey; index: number }) => {
  const childKey = rootNode.derive(DATA_DERIVATION_PATH).deriveChild(index + HARDENED_OFFSET);
  assertIsTruthy(childKey.privateKey);
  return compressPrivateKey(childKey.privateKey);
};

export const deriveAccount = ({
  rootNode,
  index,
  salt,
  stxDerivationType,
}: {
  rootNode: HDKey;
  index: number;
  salt: string;
  stxDerivationType: DerivationType.Wallet | DerivationType.Data;
}): Account => {
  const stxPrivateKey =
    stxDerivationType === DerivationType.Wallet
      ? deriveStxPrivateKey({ rootNode, index })
      : deriveDataPrivateKey({ rootNode, index });

  const identitiesKeychain = rootNode.derive(DATA_DERIVATION_PATH);
  const identityKeychain = identitiesKeychain.deriveChild(index + HARDENED_OFFSET);
  if (!identityKeychain.privateKey) throw new Error('Must have private key to derive identities');
  const dataPrivateKey = bytesToHex(identityKeychain.privateKey);

  const appsKey = identityKeychain.deriveChild(0 + HARDENED_OFFSET).privateExtendedKey;

  return {
    stxPrivateKey,
    dataPrivateKey,
    appsKey,
    salt,
    index,
  };
};
