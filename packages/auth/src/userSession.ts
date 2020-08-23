import { AppConfig } from './appConfig'
import { SessionOptions } from './sessionData'
import {
  LocalStorageStore,
  SessionDataStore,
  InstanceDataStore
} from './sessionStore'

import * as authMessages from './messages'

import {
  nextHour,
  MissingParameterError,
  InvalidStateError,
  Logger
} from '@stacks/common'
import { AuthScope } from './constants'
import { handlePendingSignIn, signUserOut, getAuthResponseToken } from './auth'
import { encryptContent, decryptContent, EncryptContentOptions } from '@stacks/encryption';


/**
 * 
 * Represents an instance of a signed in user for a particular app.
 *
 * A signed in user has access to two major pieces of information
 * about the user, the user's private key for that app and the location
 * of the user's gaia storage bucket for the app.
 *
 * A user can be signed in either directly through the interactive
 * sign in process or by directly providing the app private key.
 * 

 * 
 */
export class UserSession {
  appConfig: AppConfig

  store: SessionDataStore

  /**
   * Creates a UserSession object
   * 
   * @param options 
   */
  constructor(options?: {
    appConfig?: AppConfig,
    sessionStore?: SessionDataStore,
    sessionOptions?: SessionOptions }) {
    let runningInBrowser = true

    if (typeof window === 'undefined' && typeof self === 'undefined') {
      Logger.debug('UserSession: not running in browser')
      runningInBrowser = false
    }

    if (options && options.appConfig) {
      this.appConfig = options.appConfig
    } else if (runningInBrowser) {
      this.appConfig = new AppConfig()
    } else {
      throw new MissingParameterError('You need to specify options.appConfig')
    }

    if (options && options.sessionStore) {
      this.store = options.sessionStore
    } else if (runningInBrowser) {
      if (options) {
        this.store = new LocalStorageStore(options.sessionOptions)
      } else {
        this.store = new LocalStorageStore()
      }
    } else if (options) {
      this.store = new InstanceDataStore(options.sessionOptions)
    } else {
      this.store = new InstanceDataStore()
    }
  }

  /**
   * Generates an authentication request that can be sent to the Blockstack
   * browser for the user to approve sign in. This authentication request can
   * then be used for sign in by passing it to the [[redirectToSignInWithAuthRequest]]
   * method.
   *
   * *Note*: This method should only be used if you want to use a customized authentication
   * flow. Typically, you'd use [[redirectToSignIn]] which is the default sign in method.
   * 
   * @param transitKey A HEX encoded transit private key.
   * @param redirectURI Location to redirect the user to after sign in approval.
   * @param manifestURI Location of this app's manifest file.
   * @param scopes The permissions this app is requesting. The default is `store_write`.
   * @param appDomain The origin of the app.
   * @param expiresAt The time at which this request is no longer valid.
   * @param extraParams Any extra parameters to pass to the authenticator. Use this to 
   * pass options that aren't part of the Blockstack authentication specification, 
   * but might be supported by special authenticators.
   * 
   * @returns {String} the authentication request
   */
  makeAuthRequest(
    transitKey?: string,
    redirectURI?: string,
    manifestURI?: string,
    scopes?: Array<AuthScope | string>,
    appDomain?: string,
    expiresAt: number = nextHour().getTime(),
    extraParams: any = {}
  ): string {
    const appConfig = this.appConfig
    if (!appConfig) {
      throw new InvalidStateError('Missing AppConfig')
    }
    transitKey = transitKey || this.generateAndStoreTransitKey()
    redirectURI = redirectURI || appConfig.redirectURI()
    manifestURI = manifestURI || appConfig.manifestURI()
    scopes = scopes || appConfig.scopes
    appDomain = appDomain || appConfig.appDomain
    return authMessages.makeAuthRequest(
      transitKey, redirectURI, manifestURI,
      scopes, appDomain, expiresAt, extraParams)
  }

  /**
   * Generates a ECDSA keypair to
   * use as the ephemeral app transit private key
   * and store in the session.
   * 
   * @returns {String} the hex encoded private key
   *
   */
  generateAndStoreTransitKey(): string {
    const sessionData = this.store.getSessionData()
    const transitKey = authMessages.generateTransitKey()
    sessionData.transitKey = transitKey
    this.store.setSessionData(sessionData)
    return transitKey
  }

  /**
   * Retrieve the authentication token from the URL query.
   * 
   * @returns {String} the authentication token if it exists otherwise `null`
   */
  getAuthResponseToken(): string {
    return getAuthResponseToken()
  }

  /**
   * Check if a user is currently signed in.
   * 
   * @returns {Boolean} `true` if the user is signed in, `false` if not.
   */
  isUserSignedIn() {
    return !!this.store.getSessionData().userData
  }

  /**
   * Try to process any pending sign in request by returning a `Promise` that resolves
   * to the user data object if the sign in succeeds.
   *
   * @param {String} authResponseToken - the signed authentication response token
   * @returns {Promise} that resolves to the user data object if successful and rejects
   * if handling the sign in request fails or there was no pending sign in request.
   */
  handlePendingSignIn(authResponseToken: string = this.getAuthResponseToken()) {
    const transitKey = this.store.getSessionData().transitKey
    return handlePendingSignIn(undefined, authResponseToken, transitKey, this)
  }

  /**
   * Retrieves the user data object. The user's profile is stored in the key [[Profile]].
   * 
   * @returns {Object} User data object.
   */
  loadUserData() {
    const userData = this.store.getSessionData().userData
    if (!userData) {
      throw new InvalidStateError('No user data found. Did the user sign in?')
    }
    return userData
  }


  /**
   * Sign the user out and optionally redirect to given location.
   * @param  redirectURL Location to redirect user to after sign out. 
   * Only used in environments with `window` available
   */
  signUserOut(redirectURL?: string) {
    signUserOut(redirectURL, this)
  }

  /**
   * Encrypts the data provided with the app public key.
   * @param {String|Buffer} content  the data to encrypt
   * @param {String} options.publicKey the hex string of the ECDSA public
   * key to use for encryption. If not provided, will use user's appPrivateKey.
   * 
   * @returns {String} Stringified ciphertext object 
   */
  encryptContent(
    content: string | Buffer,
    options?: EncryptContentOptions
  ): Promise<string> {
    if (!options.privateKey) {
      options.privateKey = this.loadUserData().appPrivateKey;
    }
    return encryptContent(content, options)
  }

  /**
   * Decrypts data encrypted with `encryptContent` with the
   * transit private key.
   * @param {String|Buffer} content - encrypted content.
   * @param {String} options.privateKey - The hex string of the ECDSA private
   * key to use for decryption. If not provided, will use user's appPrivateKey.
   * @returns {String|Buffer} decrypted content.
   */
  decryptContent(content: string, options?: {privateKey?: string}): Promise<Buffer | string> {
    return decryptContent(content, options)
  }

}
