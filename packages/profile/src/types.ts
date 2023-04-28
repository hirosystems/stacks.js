const PERSON_TYPE = 'Person';
const CONTEXT = 'http://schema.org';
const IMAGE_TYPE = 'ImageObject';

export type ProfileType = typeof PERSON_TYPE;

export interface ProfileImage {
  '@type': typeof IMAGE_TYPE;
  name?: string;
  contentUrl?: string;
  [k: string]: unknown;
}

export interface PublicProfileBase {
  '@type'?: ProfileType;
  '@context'?: typeof CONTEXT;
  apps?: {
    [origin: string]: string;
  };
  appsMeta?: {
    [origin: string]: {
      publicKey: string;
      storage: string;
    };
  };
  [k: string]: unknown;
}

export interface PublicPersonProfile extends PublicProfileBase {
  '@type': typeof PERSON_TYPE;
  name?: string;
  givenName?: string;
  familyName?: string;
  description?: string;
  image?: ProfileImage[];
  website?: {
    '@type'?: string;
    url?: string;
    [k: string]: unknown;
  }[];
  account?: {
    '@type'?: string;
    service?: string;
    identifier?: string;
    proofType?: string;
    proofUrl?: string;
    proofMessage?: string;
    proofSignature?: string;
    [k: string]: unknown;
  }[];
  worksFor?: {
    '@type'?: string;
    '@id'?: string;
    [k: string]: unknown;
  }[];
  knows?: {
    '@type'?: string;
    '@id'?: string;
    [k: string]: unknown;
  }[];
  address?: {
    '@type'?: string;
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressCountry?: string;
    [k: string]: unknown;
  };
  birthDate?: string;
  taxID?: string;
  [k: string]: unknown;
}

export type PublicProfile = PublicPersonProfile;
