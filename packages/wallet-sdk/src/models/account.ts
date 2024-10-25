// https://github.com/paulmillr/scure-bip32
// Secure, audited & minimal implementation of BIP32 hierarchical deterministic (HD) wallets.
import { HDKey } from '@scure/bip32';
import { makeAuthResponse as _makeAuthResponse } from '@stacks/auth';
import { bytesToHex, utf8ToBytes } from '@stacks/common';

import {
  getPublicKeyFromPrivate,
  hashCode,
  hashSha256Sync,
  publicKeyToBtcAddress,
} from '@stacks/encryption';
import { createFetchFn, FetchFn } from '@stacks/network';
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { connectToGaiaHubWithConfig, getHubInfo, makeGaiaAssociationToken } from '../utils';
import { Account, HARDENED_OFFSET } from './common';
import {
  DEFAULT_PROFILE,
  fetchAccountProfileUrl,
  fetchProfileFromUrl,
  signAndUploadProfile,
} from './profile';

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

export const getAppPrivateKey = ({
  account,
  appDomain,
}: {
  account: Account;
  appDomain: string;
}) => {
  const hashBytes = hashSha256Sync(utf8ToBytes(`${appDomain}${account.salt}`));
  const hash = bytesToHex(hashBytes);
  const appIndex = hashCode(hash);
  const appsNode = HDKey.fromExtendedKey(account.appsKey);
  const appKeychain = appsNode.deriveChild(appIndex + HARDENED_OFFSET);
  if (!appKeychain.privateKey) throw 'Needs private key';
  return bytesToHex(appKeychain.privateKey);
};

export const makeAuthResponse = async ({
  account,
  appDomain,
  transitPublicKey,
  scopes = [],
  gaiaHubUrl,
  appPrivateKeyFromWalletSalt = null,
  additionalData = {},
  fetchFn = createFetchFn(),
}: {
  account: Account;
  appDomain: string;
  transitPublicKey: string;
  scopes?: string[];
  gaiaHubUrl: string;
  appPrivateKeyFromWalletSalt?: string | null;
  additionalData?: Record<string, any>;
  fetchFn?: FetchFn;
}) => {
  const appPrivateKey = getAppPrivateKey({ account, appDomain });
  const hubInfo = await getHubInfo(gaiaHubUrl, fetchFn);
  const profileUrl = await fetchAccountProfileUrl({ account, gaiaHubUrl: hubInfo.read_url_prefix });
  const profile = (await fetchProfileFromUrl(profileUrl, fetchFn)) || DEFAULT_PROFILE;
  if (scopes.includes('publish_data')) {
    if (!profile.apps) {
      profile.apps = {};
    }
    const publicKey = getPublicKeyFromPrivate(appPrivateKey);
    const address = publicKeyToBtcAddress(publicKey);
    const storageUrl = `${hubInfo.read_url_prefix}${address}/`;
    profile.apps[appDomain] = storageUrl;
    if (!profile.appsMeta) {
      profile.appsMeta = {};
    }
    profile.appsMeta[appDomain] = {
      storage: storageUrl,
      publicKey,
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
      ...additionalData,
    },
    {
      profileUrl,
    },
    undefined,
    appPrivateKey,
    undefined,
    transitPublicKey,
    gaiaHubUrl,
    undefined,
    associationToken,
    appPrivateKeyFromWalletSalt
  );
};
