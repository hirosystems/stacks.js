import { getProfileURLFromZoneFile } from '../utils';
import { signProfileToken, wrapProfileToken } from '@stacks/profile';
import { connectToGaiaHub, GaiaHubConfig, uploadToGaiaHub } from '@stacks/storage';
import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { fetchPrivate } from '@stacks/common';
import { Account, Profile, getGaiaAddress } from './common';

export const DEFAULT_PROFILE: Profile = {
  '@type': 'Person',
  '@context': 'http://schema.org',
};

export const DEFAULT_PROFILE_FILE_NAME = 'profile.json';

export const fetchProfileFromUrl = async (profileUrl: string) => {
  try {
    const res = await fetchPrivate(profileUrl);
    if (res.ok) {
      const json = await res.json();
      const { decodedToken } = json[0];
      return decodedToken.payload?.claim as Profile;
    }
    if (res.status === 404) {
      return null;
    }
    throw new Error('Network error when fetching profile');
  } catch (error) {
    return null;
  }
};

export const fetchAccountProfileUrl = async ({
  account,
  gaiaHubUrl,
}: {
  account: Account;
  gaiaHubUrl: string;
}) => {
  if (account.username) {
    try {
      const url = await getProfileURLFromZoneFile(account.username);
      if (url) return url;
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('Error fetching profile URL from zone file:', error);
      }
    }
  }
  return `${gaiaHubUrl}${getGaiaAddress(account)}/profile.json`;
};

export function signProfileForUpload({ profile, account }: { profile: Profile; account: Account }) {
  const privateKey = account.dataPrivateKey;
  const publicKey = getPublicKeyFromPrivate(privateKey);

  const token = signProfileToken(profile, privateKey, { publicKey });
  const tokenRecord = wrapProfileToken(token);
  const tokenRecords = [tokenRecord];
  return JSON.stringify(tokenRecords, null, 2);
}

export async function uploadProfile({
  gaiaHubUrl,
  account,
  signedProfileTokenData,
  gaiaHubConfig,
}: {
  gaiaHubUrl: string;
  account: Account;
  signedProfileTokenData: string;
  gaiaHubConfig?: GaiaHubConfig;
}) {
  const identityHubConfig =
    gaiaHubConfig || (await connectToGaiaHub(gaiaHubUrl, account.dataPrivateKey));

  await uploadToGaiaHub(
    DEFAULT_PROFILE_FILE_NAME,
    signedProfileTokenData,
    identityHubConfig,
    undefined,
    undefined,
    undefined,
    true
  );
}

export const signAndUploadProfile = async ({
  profile,
  gaiaHubUrl,
  account,
  gaiaHubConfig,
}: {
  profile: Profile;
  gaiaHubUrl: string;
  account: Account;
  gaiaHubConfig?: GaiaHubConfig;
}) => {
  const signedProfileTokenData = signProfileForUpload({ profile, account });
  await uploadProfile({ gaiaHubUrl, account, signedProfileTokenData, gaiaHubConfig });
};
