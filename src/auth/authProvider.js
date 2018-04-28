import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { updateQueryStringParameter } from '../index'
import { BLOCKSTACK_HANDLER } from '../utils'

import { Logger } from '../logger'

/**
 * Retrieves the authentication request from the query string
 * @return {String|null} the authentication request or `null` if
 * the query string parameter `authRequest` is not found
 * @private
 */
export function getAuthRequestFromURL() {
  const queryDict = queryString.parse(location.search)
  if (queryDict.authRequest !== null && queryDict.authRequest !== undefined) {
    return queryDict.authRequest.split(`${BLOCKSTACK_HANDLER}:`).join('')
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
 */
export function fetchAppManifest(authRequest) {
  return new Promise((resolve, reject) => {
    if (!authRequest) {
      reject('Invalid auth request')
    } else {
      const payload = decodeToken(authRequest).payload
      const manifestURI = payload.manifest_uri
      try {
        fetch(manifestURI)
          .then(response => response.text())
          .then(responseText => JSON.parse(responseText))
          .then(responseJSON => {
            resolve(responseJSON)
          })
          .catch((e) => {
            Logger.debug(e.stack)
            reject('URI request couldn\'t be completed')
          })
      } catch (e) {
        Logger.debug(e.stack)
        reject('URI request couldn\'t be completed')
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
 * @param  {String} authResponse encoded and signed authentication response token
 * @return {void}
 * @throws {Error} if there is no redirect uri
 * @private
 */
export function redirectUserToApp(authRequest, authResponse) {
  const payload = decodeToken(authRequest).payload
  let redirectURI = payload.redirect_uri
  Logger.debug(redirectURI)
  if (redirectURI) {
    redirectURI = updateQueryStringParameter(redirectURI, 'authResponse', authResponse)
  } else {
    throw new Error('Invalid redirect URI')
  }
  window.location = redirectURI
}
