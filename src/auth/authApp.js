'use strict'

import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { verifyAuthResponse } from './index'
import protocolCheck from 'custom-protocol-detection-blockstack'
import { BLOCKSTACK_HANDLER } from '../utils'

const BLOCKSTACK_STORAGE_LABEL = "blockstack"
const DEFAULT_BLOCKSTACK_HOST = "https://blockstack.org/auth"

export function isUserSignedIn() {
  return window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL) ? true : false
}

export function redirectUserToSignIn(authRequest,
                                     blockstackIDHost=DEFAULT_BLOCKSTACK_HOST) {
  const protocolURI = BLOCKSTACK_HANDLER + ":" + authRequest
  const httpsURI = blockstackIDHost + "?authRequest=" + authRequest
  function successCallback() {
    console.log('protocol handler detected')
    // protocolCheck should open the link for us
  }

  function failCallback() {
    console.log('protocol handler not detected')
    window.location = httpsURI
  }

  function unsupportedBrowserCallback() { // Safari is unsupported by protocolCheck
    console.log('can not detect custom protocols on this browser')
    window.location = protocolURI
  }

  protocolCheck(protocolURI, failCallback, successCallback, unsupportedBrowserCallback)
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
