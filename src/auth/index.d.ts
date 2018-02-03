// from ./authApp
export declare interface UserData {
  username: string;
  profile: Object;
  appPrivateKey: string; // TODO: Correct?
  coreSessionToken: string; // TODO: Correct?
  authResponseToken: string; // TODO: Correct?
}

export declare function isUserSignedIn(): boolean;
export declare function redirectToSignIn(redirectURI?: string, manifestURI?: string, scopes?: string[]): void;
export declare function redirectToSignInWithAuthRequest(authRequest?: string, blockstackIDHost?: string): void;
export declare function getAuthResponseToken(): string|null;
export declare function isSignInPending(): boolean;
export declare function handlePendingSignIn(nameLookupURL?: string): Promise<UserData>;
export declare function loadUserData(): UserData;
export declare function signUserOut(redirectURL?: string): void;
export declare function generateAndStoreTransitKey(): string;
export declare function getTransitKey(): string;


// from ./authMessage
export declare interface AuthMetadata {
  email?: string;
  profileUrl?: string;
}

export declare function makeAuthRequest(transitPrivateKey?: string, redirectURL?: string, manifestURI?: string, scopes?: string[], appDomain?: string, expiresAt?: number): string;
export declare function makeAuthResponse(privateKey: string, profile?: Object, username?: string, metadata?: AuthMetadata, coreToken?: string, appPrivateKey?: string, expiresAt?: number, transitPublicKey?: string): string;


// from ./authProvider
export declare function getAuthRequestFromURL(): string|null;
export declare function fetchAppManifest(authRequest: string): Promise<Object>; // TODO: Find a more specific way to describe a manifest
export declare function redirectUserToApp(authRequest: string, authResponse: string): void; // throws Error


// from ./authSession
export function makeCoreSessionRequest(appDomain: string, appMethods: string[], appPrivateKey: string, blockchainId?: string, thisDevice?: string): string;
export function sendCoreSessionRequest(coreHost: string, corePort: number, coreAuthRequest: string, apiPassword: string): Promise<string>;
export function getCoreSession(coreHost: string, corePort: number, apiPassword: string, appPrivateKey: string, blockchainId?: string, authRequest?: string, decideId?: string): string;


// from ./authVerification
export declare function verifyAuthRequest(token: string): Promise<boolean>;
export declare function verifyAuthResponse(token: string, nameLookupURL: string): Promise<boolean>;
export declare function isExpirationDateValid(token: string): boolean;
export declare function isIssuanceDateValid(token: string): boolean;
export declare function doPublicKeysMatchUsername(token: string, nameLookupURL: string): Promise<boolean>;
export declare function doPublicKeysMatchIssuer(token: string): boolean; // throws Error
export declare function doSignaturesMatchPublicKeys(token: string): boolean; // throws Error
export declare function isManifestUriValid(token: string): boolean;
export declare function isRedirectUriValid(token: string): boolean;
export declare function verifyAuthRequestAndLoadManifest(token: string): Promise<Object>; // TODO: Find a more specific way to describe a manifest
