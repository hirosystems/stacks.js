import {
  ecPairToAddress,
  getPublicKeyFromPrivate,
  hashCode,
  hashSha256Sync,
  publicKeyToAddress,
} from '@stacks/encryption';
import { makeAuthResponse as _makeAuthResponse } from '@stacks/auth';
import { TransactionVersion, getAddressFromPrivateKey } from '@stacks/transactions';
import { fromBase58 } from 'bip32';
import {
  DEFAULT_PROFILE,
  fetchAccountProfileUrl,
  fetchProfileFromUrl,
  Profile,
  signAndUploadProfile,
} from './profile';
import { ECPair } from 'bitcoinjs-lib';
import { connectToGaiaHubWithConfig, getHubInfo, makeGaiaAssociationToken } from '../utils';
import { Buffer } from '@stacks/common';

export interface Account {
  /** derivation path for this account's stx address.*/
  stxDerivationPath?: string;
  /** The private key used for STX payments */
  stxPrivateKey: string;
  /** The private key used to store profile data (and in Stacks 1.0 to register BNS names) */
  dataPrivateKey: string;
  /** The salt is the same as the wallet-level salt. Used for app-specific keys */
  salt: string;
  /** A single username registered via BNS for this account */
  username?: string;
  /** A profile object that is publicly associated with this account's username */
  profile?: Profile;
  /** The root of the keychain used to generate app-specific keys */
  appsKey: string;
  /** The index of this account in the user's wallet */
  index: number;
}

export const getStxAddress = ({
  account,
  transactionVersion = TransactionVersion.Testnet,
}: {
  account: Account;
  transactionVersion?: TransactionVersion;
}): string => {
  return getAddressFromPrivateKey(account.stxPrivateKey, transactionVersion);
};

/**
 * Get the display name of an account.
 *
 * If the account has a username, it will return the first part of the username, so `myname.id` => `myname`, and
 * `myname.blockstack.id` => `myname`.
 *
 * If the account has no username, it returns `Account ${acount.index}`
 *
 */
export const getAccountDisplayName = (account: Account) => {
  if (account.username) {
    return account.username.split('.')[0];
  }
  return `Account ${account.index + 1}`;
};

export const getGaiaAddress = (account: Account) => {
  const publicKey = getPublicKeyFromPrivate(account.dataPrivateKey);
  const address = publicKeyToAddress(publicKey);
  return address;
};

export const getAppPrivateKey = ({
  account,
  appDomain,
}: {
  account: Account;
  appDomain: string;
}) => {
  const hashBuffer = hashSha256Sync(Buffer.from(`${appDomain}${account.salt}`));
  const hash = hashBuffer.toString('hex');
  const appIndex = hashCode(hash);
  const appsNode = fromBase58(account.appsKey);
  const appKeychain = appsNode.deriveHardened(appIndex);
  if (!appKeychain.privateKey) throw 'Needs private key';
  return appKeychain.privateKey.toString('hex');
};

export const makeAuthResponse = async ({
  account,
  appDomain,
  transitPublicKey,
  scopes = [],
  gaiaHubUrl,
}: {
  account: Account;
  appDomain: string;
  transitPublicKey: string;
  scopes?: string[];
  gaiaHubUrl: string;
}) => {
  const appPrivateKey = getAppPrivateKey({ account, appDomain });
  const hubInfo = await getHubInfo(gaiaHubUrl);
  const profileUrl = await fetchAccountProfileUrl({ account, gaiaHubUrl: hubInfo.read_url_prefix });
  const profile = (await fetchProfileFromUrl(profileUrl)) || DEFAULT_PROFILE;
  if (scopes.includes('publish_data')) {
    if (!profile.apps) {
      profile.apps = {};
    }
    const challengeSigner = ECPair.fromPrivateKey(Buffer.from(appPrivateKey, 'hex'));
    const storageUrl = `${hubInfo.read_url_prefix}${ecPairToAddress(challengeSigner)}/`;
    profile.apps[appDomain] = storageUrl;
    if (!profile.appsMeta) {
      profile.appsMeta = {};
    }
    profile.appsMeta[appDomain] = {
      storage: storageUrl,
      publicKey: challengeSigner.publicKey.toString('hex'),
    };
    const gaiaHubConfig = connectToGaiaHubWithConfig({
      hubInfo,
      privateKey: account.dataPrivateKey,
      gaiaHubUrl,
    });
    await signAndUploadProfile({ profile, account, gaiaHubUrl, gaiaHubConfig });
  }

  const compressedAppPublicKey = getPublicKeyFromPrivate(appPrivateKey.slice(0, 64));
  const associationToken = makeGaiaAssociationToken({
    privateKey: account.dataPrivateKey,
    childPublicKeyHex: compressedAppPublicKey,
  });

  return _makeAuthResponse(
    account.dataPrivateKey,
    {
      ...(profile || {}),
      stxAddress: {
        testnet: getStxAddress({ account, transactionVersion: TransactionVersion.Testnet }),
        mainnet: getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet }),
      },
    },
    account.username || '',
    {
      profileUrl,
    },
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey,
    gaiaHubUrl,
    undefined,
    associationToken
  );
};
