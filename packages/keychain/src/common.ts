import { IdentityKeyPair } from './utils';

interface RefreshOptions {
  gaiaUrl: string;
}
/** @deprecated use `@stacks/profile` instead */
export interface Identity {
  keyPair: IdentityKeyPair;
  address: string;
  usernames: string[];
  defaultUsername?: string;
  profile?: Profile;
  profileUrl(gaiaUrl: string): Promise<string>;
  appPrivateKey(appDomain: string): string;
  fetchNames(): Promise<string[]>;
  refresh(opts: RefreshOptions): void;
  makeAuthResponse(options: {
    appDomain: string;
    gaiaUrl: string;
    transitPublicKey: string;
    scopes: string[] | undefined;
    stxAddress: string | undefined;
  }): Promise<string>;
}

const PERSON_TYPE = 'Person';
const CONTEXT = 'http://schema.org';
const IMAGE_TYPE = 'ImageObject';

/** @deprecated use `@stacks/profile` instead */
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
