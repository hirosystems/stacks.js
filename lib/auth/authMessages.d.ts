import 'cross-fetch/polyfill';
declare type AuthMetadata = {
    email?: string;
    profileUrl?: string;
};
/**
 * Generates a ECDSA keypair to
 * use as the ephemeral app transit private key
 * @param {SessionData} session - session object in which key will be stored
 * @return {String} the hex encoded private key
 * @private
 */
export declare function generateTransitKey(): string;
/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in. This authentication request can
 * then be used for sign in by passing it to the `redirectToSignInWithAuthRequest`
 * method.
 *
 * *Note: This method should only be used if you want to roll your own authentication
 * flow. Typically you'd use `redirectToSignIn` which takes care of this
 * under the hood.*
 *
 * @param  {String} transitPrivateKey - hex encoded transit private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @param {Object} extraParams - Any extra parameters you'd like to pass to the authenticator.
 * Use this to pass options that aren't part of the Blockstack auth spec, but might be supported
 * by special authenticators.
 * @return {String} the authentication request
 */
export declare function makeAuthRequest(transitPrivateKey?: string, redirectURI?: string, manifestURI?: string, scopes?: string[], appDomain?: string, expiresAt?: number, extraParams?: any): string;
/**
 * Encrypts the private key for decryption by the given
 * public key.
 * @param  {String} publicKey  [description]
 * @param  {String} privateKey [description]
 * @return {String} hex encoded ciphertext
 * @private
 */
export declare function encryptPrivateKey(publicKey: string, privateKey: string): string | null;
/**
 * Decrypts the hex encrypted private key
 * @param  {String} privateKey  the private key corresponding to the public
 * key for which the ciphertext was encrypted
 * @param  {String} hexedEncrypted the ciphertext
 * @return {String}  the decrypted private key
 * @throws {Error} if unable to decrypt
 *
 * @private
 */
export declare function decryptPrivateKey(privateKey: string, hexedEncrypted: string): string | null;
/**
 * Generates a signed authentication response token for an app. This
 * token is sent back to apps which use contents to access the
 * resources and data requested by the app.
 *
 * @param  {String} privateKey the identity key of the Blockstack ID generating
 * the authentication response
 * @param  {Object} profile the profile object for the Blockstack ID
 * @param  {String} username the username of the Blockstack ID if any, otherwise `null`
 * @param  {AuthMetadata} metadata an object containing metadata sent as part of the authentication
 * response including `email` if requested and available and a URL to the profile
 * @param  {String} coreToken core session token when responding to a legacy auth request
 * or `null` for current direct to gaia authentication requests
 * @param  {String} appPrivateKey the application private key. This private key is
 * unique and specific for every Blockstack ID and application combination.
 * @param  {Number} expiresAt an integer in the same format as
 * `new Date().getTime()`, milliseconds since the Unix epoch
 * @param {String} transitPublicKey the public key provide by the app
 * in its authentication request with which secrets will be encrypted
 * @param {String} hubUrl URL to the write path of the user's Gaia hub
 * @param {String} blockstackAPIUrl URL to the API endpoint to use
 * @param {String} associationToken JWT that binds the app key to the identity key
 * @return {String} signed and encoded authentication response token
 * @private
 */
export declare function makeAuthResponse(privateKey: string, profile: {}, username: string, metadata: AuthMetadata, coreToken?: string, appPrivateKey?: string, expiresAt?: number, transitPublicKey?: string, hubUrl?: string, blockstackAPIUrl?: string, associationToken?: string): string;
export {};
