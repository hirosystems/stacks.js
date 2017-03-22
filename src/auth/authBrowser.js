'use strict'

import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { makeAuthRequest, verifyAuthResponse } from './authMessages'
import { updateQueryStringParameter } from '../index'

const BLOCKSTACK_HANDLER = "blockstack"
const BLOCKSTACK_STORAGE_LABEL = "blockstack"
const DEFAULT_BLOCKSTACK_HOST = "https://blockstack.org/auth"

/**
 * For applications
 */

export function isUserSignedIn() {
  return window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL) ? true : false
}

export function redirectUserToSignIn(authRequest,
                                     blockstackIDHost=DEFAULT_BLOCKSTACK_HOST) {
  setTimeout(function() {
    window.location = blockstackIDHost + "?authRequest=" + authRequest
  }, 500)

  window.location = BLOCKSTACK_HANDLER + ":" + authRequest
}

export function getAuthResponseToken() {
  const queryDict = queryString.parse(location.search)
  return queryDict.authResponse ? queryDict.authResponse : null
}

export function isSignInPending() {
  return getAuthResponseToken() ? true : false
}

export function signUserIn(callbackFunction) {
  const authResponseToken = getAuthResponseToken()

  if (verifyAuthResponse(authResponseToken)) {
    const tokenPayload = decodeToken(authResponseToken).payload
    const userData = {
      username: tokenPayload.username,
      profile: tokenPayload.profile,
      authResponseToken: authResponseToken
    }
    window.localStorage.setItem(
      BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
    callbackFunction(true)
  } else {
    callbackFunction(false)
  }
}

export function loadUserData(callbackFunction) {
  const userData = JSON.parse(window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
  callbackFunction(userData)
}

export function signUserOut(redirectURL) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.location = redirectURL
}

/**
 * For identity providers
 */

export function getAuthRequestFromURL() {
  const queryDict = queryString.parse(location.search)
  if (queryDict.authRequest !== null && queryDict.authRequest !== undefined) {
    return queryDict.authRequest.split(BLOCKSTACK_HANDLER + ':').join('')
  } else {
    return null
  }
}

export function fetchAppManifest(authRequest) {
  return new Promise((resolve, reject) => {
    if (!authRequest) {
      reject("Invalid auth request")
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
            console.log(e.stack)
            reject("URI request couldn't be completed")
          })
      } catch(e) {
        console.log(e.stack)
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
    throw new Error("Invalid redirect URI")
  }
  window.location = redirectURI
}