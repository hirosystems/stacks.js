// @ts-ignore
import { Buffer, FetchFn, makeFetchFn } from '@stacks/common';
import { TokenSigner, Json } from 'jsontokens';
import { getPublicKeyFromPrivate, publicKeyToAddress } from '@stacks/encryption';
import randomBytes from 'randombytes';
import { GaiaHubConfig } from '@stacks/storage';

export const DEFAULT_GAIA_HUB = 'https://gaia.blockstack.org/hub/';

interface HubInfo {
  challenge_text?: string;
  read_url_prefix: string;
}

export const getHubInfo = async (hubUrl: string, fetchFn: FetchFn = makeFetchFn()) => {
  const response = await fetchFn(`${hubUrl}/hub_info`);
  const data: HubInfo = await response.json();
  return data;
};

export const makeGaiaAssociationToken = (
  secretKeyHex: string,
  childPublicKeyHex: string
): string => {
  const LIFETIME_SECONDS = 365 * 24 * 3600;
  const signerKeyHex = secretKeyHex.slice(0, 64);
  const compressedPublicKeyHex = getPublicKeyFromPrivate(signerKeyHex);
  const salt = randomBytes(16).toString('hex');
  const payload = {
    childToAssociate: childPublicKeyHex,
    iss: compressedPublicKeyHex,
    exp: LIFETIME_SECONDS + new Date().getTime() / 1000,
    iat: Date.now() / 1000,
    salt,
  };

  const tokenSigner = new TokenSigner('ES256K', signerKeyHex);
  const token = tokenSigner.sign(payload);
  return token;
};

interface ConnectToGaiaOptions {
  hubInfo: HubInfo;
  privateKey: string;
  gaiaHubUrl: string;
}

export const connectToGaiaHubWithConfig = ({
  hubInfo,
  privateKey,
  gaiaHubUrl,
}: ConnectToGaiaOptions): GaiaHubConfig => {
  const readURL = hubInfo.read_url_prefix;
  const token = makeGaiaAuthToken({ hubInfo, privateKey, gaiaHubUrl });
  const address = publicKeyToAddress(getPublicKeyFromPrivate(privateKey));
  return {
    url_prefix: readURL,
    max_file_upload_size_megabytes: 100,
    address,
    token,
    server: gaiaHubUrl,
  };
};

interface ReadOnlyGaiaConfigOptions {
  readURL: string;
  privateKey: string;
}

/**
 * When you already know the Gaia read URL, make a Gaia config that doesn't have to fetch `/hub_info`
 */
export const makeReadOnlyGaiaConfig = ({
  readURL,
  privateKey,
}: ReadOnlyGaiaConfigOptions): GaiaHubConfig => {
  const address = publicKeyToAddress(getPublicKeyFromPrivate(privateKey));
  return {
    url_prefix: readURL,
    max_file_upload_size_megabytes: 100,
    address,
    token: 'not_used',
    server: 'not_used',
  };
};

interface GaiaAuthPayload {
  gaiaHubUrl: string;
  iss: string;
  salt: string;
  [key: string]: Json;
}

const makeGaiaAuthToken = ({ hubInfo, privateKey, gaiaHubUrl }: ConnectToGaiaOptions) => {
  const challengeText = hubInfo.challenge_text;
  const iss = getPublicKeyFromPrivate(privateKey);

  const salt = randomBytes(16).toString('hex');
  const payload: GaiaAuthPayload = {
    gaiaHubUrl,
    iss,
    salt,
  };
  if (challengeText) {
    payload.gaiaChallenge = challengeText;
  }
  const token = new TokenSigner('ES256K', privateKey).sign(payload);
  return `v1:${token}`;
};

export const uploadToGaiaHub = async (
  filename: string,
  contents: Blob | Buffer | ArrayBufferView | string,
  hubConfig: GaiaHubConfig,
  fetchFn: FetchFn = makeFetchFn()
): Promise<string> => {
  const contentType = 'application/json';

  const response = await fetchFn(`${hubConfig.server}/store/${hubConfig.address}/${filename}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `bearer ${hubConfig.token}`,
    },
    body: contents,
    referrer: 'no-referrer',
    referrerPolicy: 'no-referrer',
  });
  const { publicURL } = await response.json();
  return publicURL;
};
