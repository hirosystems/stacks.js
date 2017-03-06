'use strict'

import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { makeAuthRequest } from './authMessages'

const BLOCKSTACK_HANDLER = "web+blockstack"
const BLOCKSTACK_STORAGE_LABEL = "blockstack"

export function createSimpleAppManifest(appName, appStartURL, appDescription) {
  return {
    name: appName,
    short_name: appName,
    start_url: appStartURL,
    display: "standalone",
    background_color: "#fff",
    description: appDescription
  }
}

export function isUserSignedIn() {
  return window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL) ? true : false
}

export function requestSignIn(signingKey, appManifest, identityProviderURL="http://localhost:8888/auth") {
  const authRequest = makeAuthRequest(signingKey, appManifest)

  setTimeout(function() {
    window.location = identityProviderURL + "?authRequest=" + authRequest
  }, 200)

  window.location = BLOCKSTACK_HANDLER + ":" + authRequest
}

export function getAuthResponseToken() {
  const queryDict = queryString.parse(location.search)
  return queryDict.authResponse
}

export function isSignInPending() {
  return getAuthResponseToken() ? true : false
}

export function signUserIn(callbackFunction) {
  const authResponseToken = getAuthResponseToken()
  const decodedToken = decodeToken(authResponseToken)
  const username = decodedToken.payload.username
  const profile = decodedToken.payload.profile
  
  const session = {
    username: username,
    profile: profile,
    authResponseToken: authResponseToken
  }
  window.localStorage.setItem(BLOCKSTACK_STORAGE_LABEL, JSON.stringify(session))
  callbackFunction(session)
}

export function loadSession(callbackFunction) {
  const session = JSON.parse(localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
  callbackFunction(session)
}

export function signUserOut(redirectURL) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.location = redirectURL
}