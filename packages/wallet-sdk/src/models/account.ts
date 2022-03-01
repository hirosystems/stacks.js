import { makeAuthResponse as _makeAuthResponse } from '@stacks/auth';
import { Buffer } from '@stacks/common';
import {
  getPublicKeyFromPrivate,
  hashCode,
  hashSha256Sync,
  publicKeyToAddress,
} from '@stacks/encryption';
import { getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { fromBase58 } from 'bip32';
import { connectToGaiaHubWithConfig, getHubInfo, makeGaiaAssociationToken } from '../utils';
import { Account } from './common';
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
    const address = publicKeyToAddress(getPublicKeyFromPrivate(appPrivateKey));
    const storageUrl = `${hubInfo.read_url_prefix}${address}/`;
    profile.apps[appDomain] = storageUrl;
    if (!profile.appsMeta) {
      profile.appsMeta = {};
    }
    profile.appsMeta[appDomain] = {
      storage: storageUrl,
      publicKey: getPublicKeyFromPrivate(appPrivateKey),
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
