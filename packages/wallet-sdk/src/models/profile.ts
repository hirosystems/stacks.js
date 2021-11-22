import { getProfileURLFromZoneFile } from '../utils';
import { Account, getGaiaAddress } from './account';
import { signProfileToken, wrapProfileToken } from '@stacks/profile';
import { connectToGaiaHub, GaiaHubConfig, uploadToGaiaHub } from '@stacks/storage';
import { getPublicKeyFromPrivate } from '@stacks/encryption';
import { fetchPrivate } from '@stacks/common';

const PERSON_TYPE = 'Person';
const CONTEXT = 'http://schema.org';
const IMAGE_TYPE = 'ImageObject';

export interface ProfileImage {
  '@type': typeof IMAGE_TYPE;
  name: string;
  contentUrl: string;
}

export interface Profile {
  '@type': typeof PERSON_TYPE;
  '@context': typeof CONTEXT;
  apps?: {
    [origin: string]: string;
  };
  appsMeta?: {
    [origin: string]: {
      publicKey: string;
      storage: string;
    };
  };
  name?: string;
  image?: ProfileImage[];
  [key: string]: any;
}

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

export function signProfileForUpload({
  profile,
  profilePrivateKey,
}: {
  profile: Profile;
  profilePrivateKey: string;
}) {
  const publicKey = getPublicKeyFromPrivate(profilePrivateKey.slice(0, 64));
  const token = signProfileToken(profile, profilePrivateKey, { publicKey });
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
  const signedProfileTokenData = signProfileForUpload({
    profile,
    profilePrivateKey: account.stxPrivateKey,
  });
  await uploadProfile({ gaiaHubUrl, account, signedProfileTokenData, gaiaHubConfig });
};
