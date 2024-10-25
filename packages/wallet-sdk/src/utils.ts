import { bytesToHex, ChainID } from '@stacks/common';
import { getPublicKeyFromPrivate, publicKeyToBtcAddress, randomBytes } from '@stacks/encryption';
import { createFetchFn, FetchFn } from '@stacks/network';
import { GaiaHubConfig } from '@stacks/storage';
import { Json, TokenSigner } from 'jsontokens';
import { parseZoneFile } from 'zone-file';

export function assertIsTruthy<T>(val: T): asserts val is NonNullable<T> {
  if (!val) {
    throw new Error(`expected: true, actual: ${val}`);
  }
}

interface NameInfoResponse {
  address: string;
  zonefile: string;
}

export const getProfileURLFromZoneFile = async (
  name: string,
  fetchFn: FetchFn = createFetchFn()
) => {
  const url = `https://api.hiro.so/v1/names/${name}`;
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

export const getHubInfo = async (gaiaHubUrl: string, fetchFn: FetchFn = createFetchFn()) => {
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

  const salt = bytesToHex(randomBytes(16));
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
  const address = publicKeyToBtcAddress(getPublicKeyFromPrivate(privateKey));
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
  const salt = bytesToHex(randomBytes(16));
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

interface WhenChainIdMap<T> {
  [ChainID.Mainnet]: T;
  [ChainID.Testnet]: T;
}
export function whenChainId(chainId: ChainID) {
  return <T>(chainIdMap: WhenChainIdMap<T>): T => chainIdMap[chainId];
}
