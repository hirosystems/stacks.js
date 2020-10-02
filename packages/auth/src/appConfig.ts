import { DEFAULT_SCOPE, DEFAULT_BLOCKSTACK_HOST, AuthScope } from './constants';
import { getGlobalObject } from '@stacks/common';

/**
 * Configuration data for the current app.
 *
 * On browser platforms, creating an instance of this
 * class without any arguments will use
 * `window.location.origin` as the app domain.
 * On non-browser platforms, you need to
 * specify an app domain as the second argument.
 *
 */
export class AppConfig {
  /**
   * Blockstack apps are uniquely identified by their app domain.
   *
   */
  appDomain?: string;

  /**
   * An array of string representing permissions requested by the app.
   *
   */
  scopes: (AuthScope | string)[];

  /**
   * Path on app domain to redirect users to after authentication. The
   * authentication response token will be postpended in a query.
   *
   */
  redirectPath: string;

  /**
   * Path relative to app domain of app's manifest file.
   *
   * This file needs to have CORS headers set so that it can be fetched
   * from any origin. Typically this means return the header `Access-Control-Allow-Origin: *`.
   *
   */
  manifestPath: string;

  /**
   * The URL of Blockstack core node to use for this app. If this is
   * `null`, the core node specified by the user or default core node
   * will be used.
   *
   */
  coreNode?: string;

  /**
   * The URL of a web-based Blockstack Authenticator to use in the event
   * the user doesn't have Blockstack installed on their machine. If this
   * is not specified, the current default in this library will be used.
   *
   */
  authenticatorURL?: string;

  /**
   * @param {Array<string>} scopes - permissions this app is requesting
   * @param {string} appDomain - the app domain
   * @param {string} redirectPath - path on app domain to redirect users to after authentication
   * @param {string} manifestPath - path relative to app domain of app's manifest file
   * @param {string | undefined} coreNode - override the default or user selected core node
   * @param {string} authenticatorURL - the web-based fall back authenticator
   * ([[DEFAULT_BLOCKSTACK_HOST]])
   */
  constructor(
    scopes: string[] = DEFAULT_SCOPE.slice(),
    appDomain: string | undefined = getGlobalObject('location', { returnEmptyObject: true })
      ?.origin,
    redirectPath = '',
    manifestPath = '/manifest.json',
    coreNode: string | undefined = undefined,
    authenticatorURL: string = DEFAULT_BLOCKSTACK_HOST
  ) {
    this.appDomain = appDomain;
    this.scopes = scopes;
    this.redirectPath = redirectPath;
    this.manifestPath = manifestPath;
    this.coreNode = coreNode;
    this.authenticatorURL = authenticatorURL;
  }

  /**
   * The location to which the authenticator should
   * redirect the user.
   * @returns {string} - URI
   */
  redirectURI(): string {
    return `${this.appDomain}${this.redirectPath}`;
  }

  /**
   * The location of the app's manifest file.
   * @returns {string} - URI
   */
  manifestURI(): string {
    return `${this.appDomain}${this.manifestPath}`;
  }
}
