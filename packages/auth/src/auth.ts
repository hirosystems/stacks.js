import * as queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { verifyAuthResponse } from './verification'
import { 
  fetchPrivate, 
  isLaterVersion, 
  getGlobalObject, 
  LoginFailedError,
  Logger,
  BLOCKSTACK_DEFAULT_GAIA_HUB_URL
} from '@stacks/common'
import { getAddressFromDID } from './dids'
import { decryptPrivateKey } from './messages'
import {
  NAME_LOOKUP_PATH
} from './constants'
import { extractProfile } from './legacy/profiles/profileTokens'
import { UserSession } from './userSession'
import { config } from './legacy/config'
// import { GaiaHubConfig } from './legacy/storage/hub'
import { hexStringToECPair } from '@stacks/encryption'


const DEFAULT_PROFILE = {
  '@type': 'Person',
  '@context': 'http://schema.org'
}

/**
 *  Returned from the [[UserSession.loadUserData]] function.
 */
export interface UserData {
  // public: the blockstack ID (for example: stackerson.id or alice.blockstack.id)
  username: string;
  // public: the email address for the user. only available if the `email` 
  // scope is requested, and if the user has entered a valid email into 
  // their profile. 
  //
  // **Note**: Blockstack does not require email validation 
  // for users for privacy reasons and blah blah (something like this, idk)
  email?: string;
  // probably public: (a quick description of what this is, and a link to the
  // DID foundation and/or the blockstack docs related to DID, idk)
  decentralizedID: string;
  // probably private: looks like it happens to be the btc address but idk
  // the value of establishing this as a supported field
  identityAddress: string;
  // probably public: this is an advanced feature, I think many app devs 
  // using our more advanced encryption functions (as opposed to putFile/getFile), 
  // are probably using this. seems useful to explain. 
  appPrivateKey: string;
  // maybe public: possibly useful for advanced devs / webapps. I see an opportunity
  // to make a small plug about "user owned data" here, idk. 
  hubUrl: string;
  coreNode: string;
  // maybe private: this would be an advanced field for app devs to use. 
  authResponseToken: string;
  // private: does not get sent to webapp at all.
  coreSessionToken?: string;
  // private: does not get sent to webapp at all.
  gaiaAssociationToken?: string;
  // public: this is the proper `Person` schema json for the user. 
  // This is the data that gets used when the `new blockstack.Person(profile)` class is used.
  profile: any;
  // private: does not get sent to webapp at all.
  gaiaHubConfig?: any;
}

/**
 * Retrieve the authentication token from the URL query
 * @return {String} the authentication token if it exists otherwise `null`
 */
export function getAuthResponseToken(): string {
  const search = getGlobalObject(
    'location', 
    { throwIfUnavailable: true, usageDesc: 'getAuthResponseToken' }
  ).search
  const queryDict = queryString.parse(search)
  return queryDict.authResponse ? <string>queryDict.authResponse : ''
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
    getGlobalObject(
      'location', 
      { throwIfUnavailable: true, usageDesc: 'signUserOut' }
    ).href = redirectURL
  } 
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
  if (!caller) {
    caller = new UserSession()
  }

  const sessionData = caller.store.getSessionData()

  if (sessionData.userData) {
    throw new LoginFailedError('Existing user session found.')
  }

  if (!transitKey) {
    transitKey = caller.store.getSessionData().transitKey
  }
  if (!nameLookupURL) {
    let coreNode = caller.appConfig && caller.appConfig.coreNode
    if (!coreNode) {
      coreNode = config.network.blockstackAPIUrl
    }

    const tokenPayload = decodeToken(authResponseToken).payload
    if (typeof tokenPayload === 'string') {
      throw new Error('Unexpected token payload type of string')
    }
    if (isLaterVersion(tokenPayload.version as string, '1.3.0')
       && tokenPayload.blockstackAPIUrl !== null && tokenPayload.blockstackAPIUrl !== undefined) {
      // override globally
      Logger.info(`Overriding ${config.network.blockstackAPIUrl} `
        + `with ${tokenPayload.blockstackAPIUrl}`)
      // TODO: this config is never saved so the user node preference 
      // is not respected in later sessions..
      config.network.blockstackAPIUrl = tokenPayload.blockstackAPIUrl as string
      coreNode = tokenPayload.blockstackAPIUrl as string
    }
    
    nameLookupURL = `${coreNode}${NAME_LOOKUP_PATH}`
  }
  
  const isValid = await verifyAuthResponse(authResponseToken, nameLookupURL)
  if (!isValid) {
    throw new LoginFailedError('Invalid authentication response.')
  }
  const tokenPayload = decodeToken(authResponseToken).payload
  if (typeof tokenPayload === 'string') {
    throw new Error('Unexpected token payload type of string')
  }

  // TODO: real version handling
  let appPrivateKey = tokenPayload.private_key as string
  let coreSessionToken = tokenPayload.core_token as string
  if (isLaterVersion(tokenPayload.version as string, '1.1.0')) {
    if (transitKey !== undefined && transitKey != null) {
      if (tokenPayload.private_key !== undefined && tokenPayload.private_key !== null) {
        try {
          appPrivateKey = await decryptPrivateKey(transitKey, tokenPayload.private_key as string)
        } catch (e) {
          Logger.warn('Failed decryption of appPrivateKey, will try to use as given')
          try {
            hexStringToECPair(tokenPayload.private_key as string)
          } catch (ecPairError) {
            throw new LoginFailedError('Failed decrypting appPrivateKey. Usually means'
                                      + ' that the transit key has changed during login.')
          }
        }
      }
      if (coreSessionToken !== undefined && coreSessionToken !== null) {
        try {
          coreSessionToken = await decryptPrivateKey(transitKey, coreSessionToken)
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
  let gaiaAssociationToken: string
  if (isLaterVersion(tokenPayload.version as string, '1.2.0')
    && tokenPayload.hubUrl !== null && tokenPayload.hubUrl !== undefined) {
    hubUrl = tokenPayload.hubUrl as string
  }
  if (isLaterVersion(tokenPayload.version as string, '1.3.0')
    && tokenPayload.associationToken !== null && tokenPayload.associationToken !== undefined) {
    gaiaAssociationToken = tokenPayload.associationToken as string
  }

  const userData: UserData = {
    username: tokenPayload.username as string,
    profile: tokenPayload.profile,
    email: tokenPayload.email as string,
    decentralizedID: tokenPayload.iss,
    identityAddress: getAddressFromDID(tokenPayload.iss),
    appPrivateKey,
    coreSessionToken,
    authResponseToken,
    hubUrl,
    coreNode: tokenPayload.blockstackAPIUrl as string,
    gaiaAssociationToken
  }
  const profileURL = tokenPayload.profile_url as string
  if (!userData.profile && profileURL) {
    const response = await fetchPrivate(profileURL)
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
  
  sessionData.userData = userData
  caller.store.setSessionData(sessionData)
  
  return userData
}
