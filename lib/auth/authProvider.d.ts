/**
 * Retrieves the authentication request from the query string
 * @return {String|null} the authentication request or `null` if
 * the query string parameter `authRequest` is not found
 * @private
 * @ignore
 */
export declare function getAuthRequestFromURL(): string;
/**
 * Fetches the contents of the manifest file specified in the authentication request
 *
 * @param  {String} authRequest encoded and signed authentication request
 * @return {Promise<Object|String>} Returns a `Promise` that resolves to the JSON
 * object manifest file unless there's an error in which case rejects with an error
 * message.
 * @private
 * @ignore
 */
export declare function fetchAppManifest(authRequest: string): Promise<any>;
/**
 * Redirect the user's browser to the app using the `redirect_uri`
 * specified in the authentication request, passing the authentication
 * response token as a query parameter.
 *
 * @param {String} authRequest  encoded and signed authentication request token
 * @param {String} authResponse encoded and signed authentication response token
 * @return {void}
 * @throws {Error} if there is no redirect uri
 * @private
 * @ignore
 */
export declare function redirectUserToApp(authRequest: string, authResponse: string): void;
