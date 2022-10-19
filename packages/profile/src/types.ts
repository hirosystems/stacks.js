export interface PublicProfile {
  '@context'?: string;
  '@type': string;
  '@id'?: string;
  [k: string]: unknown;
}

export interface PublicPersonProfile extends PublicProfile {
  name?: string;
  givenName?: string;
  familyName?: string;
  description?: string;
  image?: {
    '@type'?: string;
    name?: string;
    contentUrl?: string;
    [k: string]: unknown;
  }[];
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
