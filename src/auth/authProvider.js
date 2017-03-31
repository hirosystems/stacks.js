import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import fetch from 'isomorphic-fetch'
import { updateQueryStringParameter } from '../index'
import { BLOCKSTACK_HANDLER } from './authConstants'

export function getAuthRequestFromURL() {
  const queryDict = queryString.parse(window.location.search)
  if (queryDict.authRequest !== null && queryDict.authRequest !== undefined) {
    return queryDict.authRequest.split(`${BLOCKSTACK_HANDLER}:`).join('')
  } else {
    return null
  }
}

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
          .then((responseJSON) => {
            resolve(responseJSON)
          })
          .catch((e) => {
            console.error(e.stack)
            reject("URI request couldn't be completed")
          })
      } catch (e) {
        console.error(e.stack)
        reject("URI request couldn't be completed")
      }
    }
  })
}

export function redirectUserToApp(authRequest, authResponse) {
  const payload = decodeToken(authRequest).payload
  let redirectURI = payload.redirect_uri
  if (redirectURI) {
    redirectURI = updateQueryStringParameter(redirectURI, 'authResponse', authResponse)
  } else {
    throw new Error('Invalid redirect URI')
  }
  window.location = redirectURI
}
