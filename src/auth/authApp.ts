
import queryString from 'query-string'
// @ts-ignore: Could not find a declaration file for module
import { decodeToken } from 'jsontokens'
import { verifyAuthResponse } from './authVerification'
import { isLaterVersion, hexStringToECPair, checkWindowAPI } from '../utils'
import { getAddressFromDID } from '../dids'
import { LoginFailedError } from '../errors'
import { decryptPrivateKey, makeAuthRequest } from './authMessages'
import {
  BLOCKSTACK_DEFAULT_GAIA_HUB_URL,
  DEFAULT_BLOCKSTACK_HOST,
  NAME_LOOKUP_PATH
} from './authConstants'
import { extractProfile } from '../profiles/profileTokens'
import { UserSession } from './userSession'
import { config } from '../config'
import { Logger } from '../logger'
import { GaiaHubConfig } from '../storage/hub'
import { protocolEchoReplyDetection } from './protocolEchoDetection'
import { detectProtocolLaunch } from './detectProtocolLaunch'


const DEFAULT_PROFILE = {
  '@type': 'Person',
  '@context': 'http://schema.org'
}

export interface UserData {
  username: string;
  email?: string;
  decentralizedID: string;
  identityAddress: string;
  appPrivateKey: string;
  hubUrl: string;
  authResponseToken: string;
  coreSessionToken?: string;
  gaiaAssociationToken?: string;
  associationToken?: string;
  profile: any;
  gaiaHubConfig?: GaiaHubConfig;
}

/**
 * Check if a user is currently signed in.
 * @method isUserSignedIn
 * @return {Boolean} `true` if the user is signed in, `false` if not.
 */
export function isUserSignedIn() {
  console.warn('DEPRECATION WARNING: The static isUserSignedIn() function will be deprecated in '
    + 'the next major release of blockstack.js. Create an instance of UserSession and call the '
    + 'instance method isUserSignedIn().')
  const userSession = new UserSession()
  return userSession.isUserSignedIn()
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
 * use `makeAuthRequest` and `redirectToSignInWithAuthRequest` to build your own sign in process.
 *
 * @param {String} [redirectURI=`${window.location.origin}/`]
 * The location to which the identity provider will redirect the user after
 * the user approves sign in.
 * @param  {String} [manifestURI=`${window.location.origin}/manifest.json`]
 * Location of the manifest file.
 * @param  {Array} [scopes=DEFAULT_SCOPE] Defaults to requesting write access to
 * this app's data store.
 * An array of strings indicating which permissions this app is requesting.
 * @return {void}
 */
export function redirectToSignIn(redirectURI?: string, 
                                 manifestURI?: string, 
                                 scopes?: string[]) { 
  console.warn('DEPRECATION WARNING: The static redirectToSignIn() function will be deprecated in the '
    + 'next major release of blockstack.js. Create an instance of UserSession and call the '
    + 'instance method redirectToSignIn().')
  const authRequest = makeAuthRequest(null, redirectURI, manifestURI, scopes)
  redirectToSignInWithAuthRequest(authRequest)
}

/**
 * Check if there is a authentication request that hasn't been handled. 
 * Also checks for a protocol echo reply (which if detected then the page
 * will be automatically redirected after this call). 
 * @return {Boolean} `true` if there is a pending sign in, otherwise `false`
 */
export function isSignInPending() {
  try {
    const isProtocolEcho = protocolEchoReplyDetection()
    if (isProtocolEcho) {
      Logger.info('protocolEchoReply detected from isSignInPending call, the page is about to redirect.')
      return true
    }
  } catch (error) {
    Logger.error(`Error checking for protocol echo reply isSignInPending: ${error}`)
  }
  
  return !!getAuthResponseToken()
}

/**
 * Retrieve the authentication token from the URL query
 * @return {String} the authentication token if it exists otherwise `null`
 */
export function getAuthResponseToken(): string {
  checkWindowAPI('getAuthResponseToken', 'location')
  const queryDict = queryString.parse(window.location.search)
  return queryDict.authResponse ? <string>queryDict.authResponse : ''
}

/**
 * Retrieves the user data object. The user's profile is stored in the key `profile`.
 * @return {Object} User data object.
 */
export function loadUserData() {
  console.warn('DEPRECATION WARNING: The static loadUserData() function will be deprecated in the '
    + 'next major release of blockstack.js. Create an instance of UserSession and call the '
    + 'instance method loadUserData().')
  const userSession = new UserSession()
  return userSession.loadUserData()
}

/**
 * Sign the user out and optionally redirect to given location.
 * @param  redirectURL
 * Location to redirect user to after sign out. 
 * Only used in environments with `window` available
 */
export function signUserOut(redirectURL?: string, caller?: UserSession) {
  const userSession = caller || new UserSession()
  userSession.store.deleteSessionData()
  if (redirectURL) {
    if (typeof window !== 'undefined') {
      window.location.href = redirectURL
    } else {
      const errMsg = '`signUserOut` called with `redirectURL` specified'
        + ` ("${redirectURL}")`
        + ' but `window.location.href` is not available in this environment'
      Logger.error(errMsg)
      throw new Error(errMsg)
    }
  } 
}

/**
 * Redirects the user to the Blockstack browser to approve the sign in request
 * given.
 *
 * The user is redirected to the `blockstackIDHost` if the `blockstack:`
 * protocol handler is not detected. Please note that the protocol handler detection
 * does not work on all browsers.
 * @param  {String} authRequest - the authentication request generated by `makeAuthRequest`
 * @param  {String} blockstackIDHost - the URL to redirect the user to if the blockstack
 *                                     protocol handler is not detected
 * @return {void}
 */
export function redirectToSignInWithAuthRequest(
  authRequest?: string,
  blockstackIDHost: string = DEFAULT_BLOCKSTACK_HOST,
) {
  authRequest = authRequest || makeAuthRequest()
  const httpsURI = `${blockstackIDHost}?authRequest=${authRequest}`

  checkWindowAPI('redirectToSignInWithAuthRequest', 'navigator')
  checkWindowAPI('redirectToSignInWithAuthRequest', 'location')

  // If they're on a mobile OS, always redirect them to HTTPS site
  if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(window.navigator.userAgent)) {
    Logger.info('detected mobile OS, sending to https')
    window.location.href = httpsURI
    return
  }

  function successCallback() {
    Logger.info('protocol handler detected')
    // The detection function should open the link for us
  }

  function failCallback() {
    Logger.warn('protocol handler not detected')
    window.location.href = httpsURI
  }

  detectProtocolLaunch(authRequest, successCallback, failCallback)
}

/**
 * Try to process any pending sign in request by returning a `Promise` that resolves
 * to the user data object if the sign in succeeds.
 *
 * @param {String} nameLookupURL - the endpoint against which to verify public
 * keys match claimed username
 * @param {String} authResponseToken - the signed authentication response token
 * @param {String} transitKey - the transit private key that corresponds to the transit public key
 * that was provided in the authentication request
 * @return {Promise} that resolves to the user data object if successful and rejects
 * if handling the sign in request fails or there was no pending sign in request.
 */
export async function handlePendingSignIn(
  nameLookupURL: string = '', 
  authResponseToken: string = getAuthResponseToken(), 
  transitKey?: string,
  caller?: UserSession
): Promise<UserData> {
  try {
    const isProtocolEcho = protocolEchoReplyDetection()
    if (isProtocolEcho) {
      const msg = 'handlePendingSignIn called while protocolEchoReply was detected, and ' 
        + 'the page is about to redirect. This function will resolve with an error after '
        + 'several seconds, if the page was not redirected for some reason.'
      Logger.info(msg)
      return new Promise<UserData>((_resolve, reject) => {
        setTimeout(() => {
          Logger.error('Page should have redirected by now. handlePendingSignIn will now throw.')
          reject(msg)
        }, 3000)
      })
    }
  } catch (error) {
    Logger.error(`Error checking for protocol echo reply handlePendingSignIn: ${error}`)
  }

  if (!caller) {
    caller = new UserSession()
  }
  if (!transitKey) {
    transitKey = caller.store.getSessionData().transitKey
  }
  if (!nameLookupURL) {
    const tokenPayload = decodeToken(authResponseToken).payload
    if (isLaterVersion(tokenPayload.version, '1.3.0')
       && tokenPayload.blockstackAPIUrl !== null && tokenPayload.blockstackAPIUrl !== undefined) {
      // override globally
      Logger.info(`Overriding ${config.network.blockstackAPIUrl} `
        + `with ${tokenPayload.blockstackAPIUrl}`)
      config.network.blockstackAPIUrl = tokenPayload.blockstackAPIUrl
    }
    nameLookupURL = `${config.network.blockstackAPIUrl}${NAME_LOOKUP_PATH}`
  }
  
  const isValid = await verifyAuthResponse(authResponseToken, nameLookupURL)
  if (!isValid) {
    throw new LoginFailedError('Invalid authentication response.')
  }
  const tokenPayload = decodeToken(authResponseToken).payload
  // TODO: real version handling
  let appPrivateKey = tokenPayload.private_key
  let coreSessionToken = tokenPayload.core_token
  if (isLaterVersion(tokenPayload.version, '1.1.0')) {
    if (transitKey !== undefined && transitKey != null) {
      if (tokenPayload.private_key !== undefined && tokenPayload.private_key !== null) {
        try {
          appPrivateKey = decryptPrivateKey(transitKey, tokenPayload.private_key)
        } catch (e) {
          Logger.warn('Failed decryption of appPrivateKey, will try to use as given')
          try {
            hexStringToECPair(tokenPayload.private_key)
          } catch (ecPairError) {
            throw new LoginFailedError('Failed decrypting appPrivateKey. Usually means'
                                      + ' that the transit key has changed during login.')
          }
        }
      }
      if (coreSessionToken !== undefined && coreSessionToken !== null) {
        try {
          coreSessionToken = decryptPrivateKey(transitKey, coreSessionToken)
        } catch (e) {
          Logger.info('Failed decryption of coreSessionToken, will try to use as given')
        }
      }
    } else {
      throw new LoginFailedError('Authenticating with protocol > 1.1.0 requires transit'
                                + ' key, and none found.')
    }
  }
  let hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL
  let gaiaAssociationToken
  if (isLaterVersion(tokenPayload.version, '1.2.0')
    && tokenPayload.hubUrl !== null && tokenPayload.hubUrl !== undefined) {
    hubUrl = tokenPayload.hubUrl
  }
  if (isLaterVersion(tokenPayload.version, '1.3.0')
    && tokenPayload.associationToken !== null && tokenPayload.associationToken !== undefined) {
    gaiaAssociationToken = tokenPayload.associationToken
  }

  const userData: UserData = {
    username: tokenPayload.username,
    profile: tokenPayload.profile,
    email: tokenPayload.email,
    decentralizedID: tokenPayload.iss,
    identityAddress: getAddressFromDID(tokenPayload.iss),
    appPrivateKey,
    coreSessionToken,
    authResponseToken,
    hubUrl,
    gaiaAssociationToken
  }
  const profileURL = tokenPayload.profile_url
  if (!userData.profile && profileURL) {
    const response = await fetch(profileURL)
    if (!response.ok) { // return blank profile if we fail to fetch
      userData.profile = Object.assign({}, DEFAULT_PROFILE)
    } else {
      const responseText = await response.text()
      const wrappedProfile = JSON.parse(responseText)
      const profile = extractProfile(wrappedProfile[0].token)
      userData.profile = profile
    }
  } else {
    userData.profile = tokenPayload.profile
  }
  
  const sessionData = caller.store.getSessionData()
  sessionData.userData = userData
  caller.store.setSessionData(sessionData)
  
  return userData
}
