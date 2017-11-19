/* TODO
 * ====
 * 
 * [x] Profile from ./profile
 * 
 * [x] Person from ./profileSchemas
 * [ ] Organization from ./profileSchemas
 * [ ] CreativeWork from ./profileSchemas
 * [x] resolveZoneFileToPerson from ./profileSchemas
 * 
 * [x] signProfileToken from ./profileTokens
 * [x] wrapProfileToken from ./profileTokens
 * [x] verifyProfileToken from ./profileTokens
 * [x] extractProfile from ./profileTokens
 * 
 * [ ] validateProofs from ./profileProofs
 * 
 * [ ] profileServices from ./services
 * [ ] containsValidProofStatement from ./services
 * [ ] containsValidAddressProofStatement from ./services
 * 
 * [ ] makeProfileZoneFile from ./profileZoneFiles
 * [ ] getTokenFileUrl from ./profileZoneFiles
 */



// from ./profile
 export declare interface Proof {
  service: string;
  proof_url: string;
  identifier: string;
  valid: boolean;
}

export declare class Profile {
  constructor(profile: Object);
  toJSON(): {'@context': string} & {[x: string]: any};
  toToken(privateKey: string): Object;
  static fromToken(token: string, publicKeyOrAddress?: string): Profile;
  static makeZoneFile(domainName: string, tokenFileURL: string): string;
  static validateProofs(domainName: string): Promise<Proof[]>;
  static validateSchema(profile: Profile, strict?: boolean): Object;
}


// from ./profileSchemas
export declare interface BlockstackName {
  type: string;
  id: string;
}

export declare interface BlockstackAccount {
  type: string;
  service: string;
  identifier: string;
  proofType: string;
  proofUrl: string;
  proofMessage: string;
  proofSignature: string;
}

export declare class Person extends Profile {
  address(): string;
  avatarUrl(): string;
  birthDate(): string;
  connections(): BlockstackName[];
  description(): string;
  familyName(): string;
  givenName(): string;
  name(): string;
  organizations(): BlockstackName[];
  profile(): Object;
  verifiedAccounts(verifications: any[]): BlockstackAccount[]; // TODO: What's the input?
  static fromLegacyFormat(legacyProfile: Object): Person;
  static fromToken(token: string, publicKeyOrAddress?: string): Person;
}

export declare function resolveZoneFileToPerson(zoneFile: string, publicKeyOrAddress: string, callback: (profile: Profile|{}) => {}): Person;


// from ./profileTokens
export declare function signProfileToken(profile: Object, privateKey: string, subject?: Object, issuer?: Object, signingAlgorithm?: string, issuedAt?: Date, expiresAt?: Date): Object; // throws Error
export declare function wrapProfileToken(token: string): Object;
export declare function verifyProfileToken(token: string, publicKeyOrAddress: string): Object; // throws Error
export declare function extractProfile(token: string, publicKeyOrAddress?: string): Object; // throws Error
