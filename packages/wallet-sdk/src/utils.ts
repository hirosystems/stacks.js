import { FetchFn, makeFetchFn } from '@stacks/common';
import { getPublicKeyFromPrivate, publicKeyToAddress, randomBytes } from '@stacks/encryption';
import { GaiaHubConfig } from '@stacks/storage';
import { AssertionError } from 'assert';
import { Json, TokenSigner } from 'jsontokens';
import { parseZoneFile } from 'zone-file';

export function assertIsTruthy<T>(val: T): asserts val is NonNullable<T> {
  if (!val) {
    throw new AssertionError({ expected: true, actual: val });
  }
}

interface NameInfoResponse {
  address: string;
  zonefile: string;
}

export const getProfileURLFromZoneFile = async (name: string, fetchFn: FetchFn = makeFetchFn()) => {
  const url = `https://stacks-node-api.stacks.co/v1/names/${name}`;
  const res = await fetchFn(url);
  if (res.ok) {
    const nameInfo: NameInfoResponse = await res.json();
    const zone = parseZoneFile(nameInfo.zonefile);
    const uri = zone.uri?.[0]?.target;
    if (uri) {
      return uri;
    }
    throw new Error(`No zonefile uri found: ${nameInfo.zonefile}`);
  }
  return;
};

interface HubInfo {
  challenge_text?: string;
  read_url_prefix: string;
}

export const getHubInfo = async (gaiaHubUrl: string, fetchFn: FetchFn = makeFetchFn()) => {
  const response = await fetchFn(`${gaiaHubUrl}/hub_info`);
  const data: HubInfo = await response.json();
  return data;
};

const makeGaiaAuthToken = ({
  hubInfo,
  privateKey,
  gaiaHubUrl,
}: {
  hubInfo: HubInfo;
  privateKey: string;
  gaiaHubUrl: string;
}) => {
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

interface GaiaAuthPayload {
  gaiaHubUrl: string;
  iss: string;
  salt: string;
  [key: string]: Json;
}

export const makeGaiaAssociationToken = ({
  privateKey: secretKeyHex,
  childPublicKeyHex,
}: {
  privateKey: string;
  childPublicKeyHex: string;
}): string => {
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
