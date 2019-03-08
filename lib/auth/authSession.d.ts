import 'cross-fetch/polyfill';
/**
 * Create an authentication token to be sent to the Core API server
 * in order to generate a Core session JWT.
 *
 * @param {String} appDomain  The unique application identifier (e.g. foo.app, www.foo.com, etc).
 * @param {Array} appMethods  The list of API methods this application will need.
 * @param {String} appPrivateKey  The application-specific private key
 * @param {String|null} blockchainID  This is the blockchain ID of the requester
 * @param {String} thisDevice Identifier of the current device
 *
 * @return {String} a JWT signed by the app's private key
 * @deprecated
 * @private
 */
export declare function makeCoreSessionRequest(appDomain: string, appMethods: Array<string>, appPrivateKey: string, blockchainID?: string, thisDevice?: string): any;
/**
 * Send Core a request for a session token.
 *
 * @param {String} coreHost host name of the core node
 * @param {Number} corePort port number of the core node
 * @param {String} coreAuthRequest  a signed JWT encoding the authentication request
 * @param {String} apiPassword the API password for Core
 *
 * @return {Promise} the resolves to a JWT signed with the Core API server's private key
 * that authorizes the bearer to carry out the requested operations and rejects
 * with an error message otherwise
 * @deprecated
 * @private
 */
export declare function sendCoreSessionRequest(coreHost: string, corePort: number, coreAuthRequest: string, apiPassword: string): Promise<any>;
/**
 * Get a core session token.  Generate an auth request, sign it, send it to Core,
 * and get back a session token.
 *
 * @param {String} coreHost Core API server's hostname
 * @param {Number} corePort Core API server's port number
 * @param {String} apiPassword core api password
 * @param  {String} appPrivateKey Application's private key
 * @param  {String} blockchainId blockchain ID of the user signing in.
 * `null` if user has no blockchain ID
 * @param {String} authRequest authentication request token
 * @param {String} deviceId identifier for the current device
 *
 * @return {Promise} a Promise that resolves to a Core session token or rejects
 * with an error message.
 * @deprecated
 * @private
 */
export declare function getCoreSession(coreHost: string, corePort: number, apiPassword: string, appPrivateKey: string, blockchainId?: string, authRequest?: string, deviceId?: string): Promise<any>;
