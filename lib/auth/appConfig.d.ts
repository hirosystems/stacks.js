/**
 * Configuration data for the current app.
 *
 * On browser platforms, creating an instance of this
 * class without any arguments will use
 * `window.location.origin` as the app domain.
 * On non-browser platforms, you need to
 * specify an app domain as the first argument.
 * @type {AppConfig}
 */
export declare class AppConfig {
    /**
     * Blockstack apps are uniquely identified by their app domain.
     * @type {string}
     */
    appDomain: string;
    /**
     * An array of string representing permissions requested by the app.
     * @type {[Array<string>}
     */
    scopes: Array<string>;
    /**
     * Path on app domain to redirect users to after authentication. The
     * authentication response token will be postpended in a query.
     * @type {string}
     */
    redirectPath: string;
    /**
     * Path relative to app domain of app's manifest file.
     *
     * This file needs to have CORS headers set so that it can be fetched
     * from any origin. Typically this means return the header `Access-Control-Allow-Origin: *`.
     * @type {string}
     */
    manifestPath: string;
    /**
     * The URL of Blockstack core node to use for this app. If this is
     * `null`, the core node specified by the user or default core node
     * will be used.
     * @type {string}
     */
    coreNode: string;
    /**
     * The URL of a web-based Blockstack Authenticator to use in the event
     * the user doesn't have Blockstack installed on their machine. If this
     * is not specified, the current default in this library will be used.
     * @type {string}
     */
    authenticatorURL?: string;
    /**
     * @param {Array<string>} scopes - permissions this app is requesting
     * @param {string} appDomain - the app domain
     * @param {string} redirectPath - path on app domain to redirect users to after authentication
     * @param {string} manifestPath - path relative to app domain of app's manifest file
     * @param {string} coreNode - override the default or user selected core node
     * @param {string} authenticatorURL - the web-based fall back authenticator
     */
    constructor(scopes?: Array<string>, appDomain?: string, redirectPath?: string, manifestPath?: string, coreNode?: string | null, authenticatorURL?: string);
    /**
     * The location to which the authenticator should
     * redirect the user.
     * @returns {string} - URI
     */
    redirectURI(): string;
    /**
     * The location of the app's manifest file.
     * @returns {string} - URI
     */
    manifestURI(): string;
}
