import { makeAuthResponse } from '@stacks/auth';
import { getPublicKeyFromPrivate, publicKeyToAddress } from '@stacks/encryption';
import { createFetchFn, FetchFn } from '@stacks/network';
import { bip32 } from 'bitcoinjs-lib';
import { Identity as IdentifyInterface, Profile } from './common';
import IdentityAddressOwnerNode from './nodes/identity-address-owner-node';
import { DEFAULT_PROFILE, fetchProfile, signAndUploadProfile } from './profiles';
import { getProfileURLFromZoneFile, IdentityKeyPair } from './utils';
import {
  connectToGaiaHubWithConfig,
  DEFAULT_GAIA_HUB,
  getHubInfo,
  makeGaiaAssociationToken,
} from './utils/gaia';

interface IdentityConstructorOptions {
  keyPair: IdentityKeyPair;
  address: string;
  usernames?: string[];
  defaultUsername?: string;
  profile?: Profile;
}

interface RefreshOptions {
  gaiaUrl: string;
}

/** @deprecated use `@stacks/auth` and `@stacks/profile` instead */
export class Identity implements IdentifyInterface {
  public keyPair: IdentityKeyPair;
  public address: string;
  public defaultUsername?: string;
  public usernames: string[];
  public profile?: Profile;

  constructor({
    keyPair,
    address,
    usernames,
    defaultUsername,
    profile,
  }: IdentityConstructorOptions) {
    this.keyPair = keyPair;
    this.address = address;
    this.usernames = usernames || [];
    this.defaultUsername = defaultUsername;
    this.profile = profile;
  }

  async makeAuthResponse({
    appDomain,
    gaiaUrl,
    transitPublicKey,
    scopes = [],
    stxAddress,
  }: {
    appDomain: string;
    gaiaUrl: string;
    transitPublicKey: string;
    scopes?: string[];
    stxAddress?: string;
  }) {
    const appPrivateKey = this.appPrivateKey(appDomain);
    const hubInfo = await getHubInfo(gaiaUrl);
    const profileUrl = await this.profileUrl(hubInfo.read_url_prefix);
    const profile: Profile =
      (await fetchProfile({ identity: this, gaiaUrl: hubInfo.read_url_prefix })) || DEFAULT_PROFILE;
    if (scopes.includes('publish_data')) {
      if (!profile.apps) {
        profile.apps = {};
      }
      const publicKey = getPublicKeyFromPrivate(appPrivateKey);
      const address = publicKeyToAddress(publicKey);
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
        privateKey: this.keyPair.key,
        gaiaHubUrl: gaiaUrl,
      });
      await signAndUploadProfile({ profile, identity: this, gaiaHubUrl: gaiaUrl, gaiaHubConfig });
    }
    this.profile = profile;

    const compressedAppPublicKey = getPublicKeyFromPrivate(appPrivateKey.slice(0, 64));
    const associationToken = makeGaiaAssociationToken(this.keyPair.key, compressedAppPublicKey);

    return makeAuthResponse(
      this.keyPair.key,
      {
        ...(this.profile || {}),
        stxAddress,
      },
      {
        profileUrl,
      },
      undefined,
      appPrivateKey,
      undefined,
      transitPublicKey,
      gaiaUrl,
      undefined,
      associationToken
    );
  }

  appPrivateKey(appDomain: string) {
    const { salt, appsNodeKey } = this.keyPair;
    const appsNode = new IdentityAddressOwnerNode(bip32.fromBase58(appsNodeKey), salt);
    return appsNode.getAppPrivateKey(appDomain);
  }

  async profileUrl(gaiaUrl: string): Promise<string> {
    if (this.defaultUsername) {
      try {
        const url = await getProfileURLFromZoneFile(this.defaultUsername);
        if (url) return url;
      } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn('Error fetching profile URL from zone file:', error);
        }
      }
    }
    return `${gaiaUrl}${this.address}/profile.json`;
  }

  async fetchNames(fetchFn: FetchFn = createFetchFn()) {
    const getNamesUrl = `https://stacks-node-api.stacks.co/v1/addresses/bitcoin/${this.address}`;
    const res = await fetchFn(getNamesUrl);
    const data = await res.json();
    const { names }: { names: string[] } = data;
    return names;
  }

  /**
   * Fetch existing information related to this identity, like username and profile information
   */
  async refresh(opts: RefreshOptions = { gaiaUrl: DEFAULT_GAIA_HUB }) {
    try {
      const names = await this.fetchNames();
      if (names) {
        if (names[0] && !this.defaultUsername) {
          this.defaultUsername = names[0];
        }
        names.forEach(name => {
          const existingIndex = this.usernames.findIndex(u => u === name);
          if (existingIndex === -1) {
            this.usernames.push(name);
          }
        });
      }
      const profile = await fetchProfile({ identity: this, gaiaUrl: opts.gaiaUrl });
      if (profile) {
        this.profile = profile;
      }
      return;
    } catch (error) {
      return;
    }
  }
}

export default Identity;
