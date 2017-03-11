'use strict'

import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { makeAuthRequest, verifyAuthResponse } from './authMessages'

const BLOCKSTACK_HANDLER = "web+blockstack"
const BLOCKSTACK_STORAGE_LABEL = "blockstack"
const DEFAULT_BLOCKSTACK_HOST = "https://blockstack.org/auth"

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
  return queryDict.authResponse
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
  const userData = JSON.parse(localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
  callbackFunction(userData)
}

export function signUserOut(redirectURL) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.location = redirectURL
}