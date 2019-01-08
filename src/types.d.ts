declare module 'blockstack' {
  // authentication

  export function redirectToSignIn(redirectURI: string, manifestURI: string, scopes: any[]): void

  export function isSignInPending(): boolean

  export function handlePendingSignIn(
    nameLookupURL?: string,
    authResponseToken?: string,
    transitKey?: string
  ): Promise<any>

  export function loadUserData(): Object

  export function isUserSignedIn(): boolean

  export function signUserOut(redirectURL: string): void

  export function makeAuthRequest(
    transitPrivateKey: string,
    redirectURI: string,
    manifestURI: string,
    scopes: string[],
    appDomain: string,
    expiresAt: number
  ): string

  export function generateAndStoreTransitKey(): string

  export function redirectToSignInWithAuthRequest(
    authRequest: string,
    blockstackIDHost: string
  ): void

  export function getAuthResponseToken(): string

  // profiles

  export function extractProfile(token: string, publicKeyOrAddress: string): Object

  export function wrapProfileToken(token: string): Object

  export function signProfileToken(
    profile: Object,
    privateKey: string,
    subject: Object,
    issuer: Object,
    signingAlgorithm: string,
    issuedAt: Date,
    expiresAt: Date
  ): Object

  export function verifyProfileToken(token: string, publicKeyOrAddress: string): Object

  export function validateProofs(profile: Object, ownerAddress: string, name: string): Promise<any>

  export function lookupProfile(username: string, zoneFileLookupURL: string): Promise<any>

  // storage

  export function getFile(path: String, options: Object): Promise<any>

  export function putFile(path: string, content: string | Buffer, options: Object): Promise<any>

  export function encryptContent(content: string | Buffer, options: Object): string

  export function decryptContent(content: string | Buffer, options: Object): string | Buffer

  export function getAppBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<any>

  export function getUserAppFileUrl(
    path: string,
    username: string,
    appOrigin: string,
    zoneFileLookupURL: string
  ): Promise<any>

  export function getNamePrice(fullyQualifiedName: string): Promise<any>

  export function getNamespacePrice(namespaceID: string): Promise<any>

  export function getGracePeriod(): Promise<any>

  export function getNamesOwned(address: string): Promise<any>

  export function getNamespaceBurnAddress(namespace: string): Promise<any>

  export function getNameInfo(fullyQualifiedName: string): Promise<any>

  export function getNamespaceInfo(namespaceID: string): Promise<any>

  export function getZonefile(zonefileHash: string): Promise<any>

  export function getAccountStatus(address: string, tokenType: string): Promise<any>

  export function getAccountHistoryPage(address: string, page: number): Promise<any>

  export function getAccountAt(address: string, blockHeight: number): Promise<any>

  export function getAccountTokens(address: string): Promise<any>

  export function getAccountBalance(address: string, tokenType: string): Promise<any>

  export function estimateTokenTransfer(
    recipientAddress: string,
    tokenType: string,
    tokenAmount: Object,
    scratchArea: string,
    senderUtxos: number,
    additionalOutputs: number
  ): Promise<any>

  export function listFiles(callback: (...args: any[]) => any): Promise<any>
}
