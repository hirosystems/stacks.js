import * as queryString from 'query-string'
// @ts-ignore: Could not find a declaration file for module
import { decodeToken } from 'jsontokens'
import { BLOCKSTACK_HANDLER, getGlobalObject, updateQueryStringParameter } from '../utils'
import { fetchPrivate } from '../fetchUtil'


import { Logger } from '../logger'

/**
 * Retrieves the authentication request from the query string
 * @return {String|null} the authentication request or `null` if
 * the query string parameter `authRequest` is not found
 * @private
 * @ignore 
 */
export function getAuthRequestFromURL() {
  const location = getGlobalObject('location', { throwIfUnavailable: true, usageDesc: 'getAuthRequestFromURL' })
  const queryDict = queryString.parse(location.search)
  if (queryDict.authRequest) {
    return (<string>queryDict.authRequest).split(`${BLOCKSTACK_HANDLER}:`).join('')
  } else {
    return null
  }
}

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
export function fetchAppManifest(authRequest: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!authRequest) {
      reject('Invalid auth request')
    } else {
      const payload = decodeToken(authRequest).payload
      if (typeof payload === 'string') {
        throw new Error('Unexpected token payload type of string')
      }  
      const manifestURI = payload.manifest_uri
      try {
        Logger.debug(`Fetching manifest from ${manifestURI}`)
        fetchPrivate(manifestURI)
          .then(response => response.text())
          .then(responseText => JSON.parse(responseText))
          .then((responseJSON) => {
            resolve({ ...responseJSON, manifestURI })
          })
          .catch((e) => {
            Logger.debug(e.stack)
            reject('Could not fetch manifest.json')
          })
      } catch (e) {
        Logger.debug(e.stack)
        reject('Could not fetch manifest.json')
      }
    }
  })
}

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
export function redirectUserToApp(authRequest: string, authResponse: string) {
  const payload = decodeToken(authRequest).payload
  if (typeof payload === 'string') {
    throw new Error('Unexpected token payload type of string')
  }
  let redirectURI = payload.redirect_uri
  Logger.debug(redirectURI)
  if (redirectURI) {
    redirectURI = updateQueryStringParameter(redirectURI, 'authResponse', authResponse)
  } else {
    throw new Error('Invalid redirect URI')
  }
  const location = getGlobalObject('location', { throwIfUnavailable: true, usageDesc: 'redirectUserToApp' })
  location.href = redirectURI
}
