import { AppConfig } from './appConfig'
import { SessionOptions } from './sessionData'
import {
  LocalStorageStore,
  SessionDataStore,
  InstanceDataStore
} from './sessionStore'

import * as authApp from './authApp'
import * as authMessages from './authMessages'
import * as storage from '../storage'

import {
  nextHour
} from '../utils'
import {
  MissingParameterError,
  InvalidStateError
} from '../errors'
import { Logger } from '../logger'
import { GaiaHubConfig, connectToGaiaHub } from '../storage/hub'
import { BLOCKSTACK_DEFAULT_GAIA_HUB_URL, AuthScope } from './authConstants'


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
   * Generates an authentication request and redirects the user to the Blockstack
   * browser to approve the sign in request.
   *
   * Please note that this requires that the web browser properly handles the
   * `blockstack:` URL protocol handler.
   *
   * Most applications should use this
   * method for sign in unless they require more fine grained control over how the
   * authentication request is generated. If your app falls into this category,
   * use [[generateAndStoreTransitKey]], [[makeAuthRequest]],
   * and [[redirectToSignInWithAuthRequest]] to build your own sign in process.
   * 
   * @param redirectURI Location of your application.
   * @param manifestURI Location of the manifest.json file
   * @param scopes Permissions requested by the application. Possible values are
   *  `store_write` (default) or `publish_data`.
   * 
   * @returns {void}
   */
  redirectToSignIn(
    redirectURI?: string,
    manifestURI?: string,
    scopes?: Array<AuthScope | string>
  ) {
    const transitKey = this.generateAndStoreTransitKey()
    const authRequest = this.makeAuthRequest(transitKey, redirectURI, manifestURI, scopes)
    const authenticatorURL = this.appConfig && this.appConfig.authenticatorURL
    return authApp.redirectToSignInWithAuthRequest(authRequest, authenticatorURL)
  }

  /**
   * Redirects the user to the Blockstack browser to approve the sign in request. 
   * To construct a request see the [[makeAuthRequest]] function.
   *
   * The user is redirected to the authenticator URL specified in the `AppConfig`
   * if the `blockstack:` protocol handler is not detected.
   * Please note that the protocol handler detection does not work on all browsers.
   * 
   * @param authRequest A request string built by the [[makeAuthRequest]] function
   * @param blockstackIDHost The ID of the Blockstack Browser application.
   * 
   */
  redirectToSignInWithAuthRequest(
    authRequest?: string,
    blockstackIDHost?: string
  ) {
    authRequest = authRequest || this.makeAuthRequest()
    const authenticatorURL = blockstackIDHost 
      || (this.appConfig && this.appConfig.authenticatorURL)
    return authApp.redirectToSignInWithAuthRequest(authRequest, authenticatorURL)
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
    return authApp.getAuthResponseToken()
  }

  /**
   * Check if there is a authentication request that hasn't been handled.
   * 
   * @returns{Boolean} `true` if there is a pending sign in, otherwise `false`
   */
  isSignInPending() {
    return authApp.isSignInPending()
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
    const nameLookupURL = this.store.getSessionData().coreNode
    return authApp.handlePendingSignIn(nameLookupURL, authResponseToken, transitKey, this)
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
    authApp.signUserOut(redirectURL, this)
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
    options?: {publicKey?: string}
  ) {
    return storage.encryptContent(content, options, this)
  }

  /**
   * Decrypts data encrypted with `encryptContent` with the
   * transit private key.
   * @param {String|Buffer} content - encrypted content.
   * @param {String} options.privateKey - The hex string of the ECDSA private
   * key to use for decryption. If not provided, will use user's appPrivateKey.
   * @returns {String|Buffer} decrypted content.
   */
  decryptContent(content: string, options?: {privateKey?: string}) {
    return storage.decryptContent(content, options, this)
  }

  /**
   * Stores the data provided in the app's data store to to the file specified.
   * @param {String} path - the path to store the data in
   * @param {String|Buffer} content - the data to store in the file
   * @param options a [[PutFileOptions]] object
   * 
   * @returns {Promise} that resolves if the operation succeed and rejects
   * if it failed
   */
  putFile(path: string, content: string | Buffer, options?: import('../storage').PutFileOptions) {
    return storage.putFile(path, content, options, this)
  }

  /**
   * Retrieves the specified file from the app's data store.
   * 
   * @param {String} path - the path to the file to read
   * @param {Object} options a [[GetFileOptions]] object
   * 
   * @returns {Promise} that resolves to the raw data in the file
   * or rejects with an error
   */
  getFile(path: string, options?: import('../storage').GetFileOptions) {
    return storage.getFile(path, options, this)
  }

  /**
   * Get the URL for reading a file from an app's data store.
   * 
   * @param {String} path - the path to the file to read
   * 
   * @returns {Promise<string>} that resolves to the URL or rejects with an error
   */
  getFileUrl(path: string, options?: import('../storage').GetFileUrlOptions): Promise<string> {
    return storage.getFileUrl(path, options, this)
  }

  /**
   * List the set of files in this application's Gaia storage bucket.
   * 
   * @param {function} callback - a callback to invoke on each named file that
   * returns `true` to continue the listing operation or `false` to end it
   * 
   * @returns {Promise} that resolves to the number of files listed
   */
  listFiles(callback: (name: string) => boolean): Promise<number> {
    return storage.listFiles(callback, this)
  }

  /**
   * Deletes the specified file from the app's data store. 
   * @param path - The path to the file to delete.
   * @param options - Optional options object.
   * @param options.wasSigned - Set to true if the file was originally signed
   * in order for the corresponding signature file to also be deleted.
   * @returns Resolves when the file has been removed or rejects with an error.
   */
  public deleteFile(path: string, options?: { wasSigned?: boolean }) {
    return storage.deleteFile(path, options, this)
  }


  /**
   *  @ignore
   */
  getOrSetLocalGaiaHubConnection(): Promise<GaiaHubConfig> {
    const sessionData = this.store.getSessionData()
    const userData = sessionData.userData
    if (!userData) {
      throw new InvalidStateError('Missing userData')
    }
    const hubConfig = userData.gaiaHubConfig
    if (hubConfig) {
      return Promise.resolve(hubConfig)
    }
    return this.setLocalGaiaHubConnection()
  }

  /**
   * These two functions are app-specific connections to gaia hub,
   *   they read the user data object for information on setting up
   *   a hub connection, and store the hub config to localstorage
   * @private
   * @returns {Promise} that resolves to the new gaia hub connection
   */
  async setLocalGaiaHubConnection(): Promise<GaiaHubConfig> {
    const userData = this.loadUserData()
  
    if (!userData) {
      throw new InvalidStateError('Missing userData')
    }
  
    if (!userData.hubUrl) {
      userData.hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL
    }
  
    const gaiaConfig = await connectToGaiaHub(
      userData.hubUrl,
      userData.appPrivateKey,
      userData.gaiaAssociationToken)

    userData.gaiaHubConfig = gaiaConfig

    const sessionData = this.store.getSessionData()
    sessionData.userData.gaiaHubConfig = gaiaConfig
    this.store.setSessionData(sessionData)

    return gaiaConfig
  }
}
