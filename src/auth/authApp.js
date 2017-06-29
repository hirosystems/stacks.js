import queryString from 'query-string'
import { decodeToken } from 'jsontokens'
import { makeAuthRequest, verifyAuthResponse } from './index'
import protocolCheck from 'custom-protocol-detection-blockstack'
import { BLOCKSTACK_HANDLER } from '../utils'
import { makeECPrivateKey } from '../index'

const BLOCKSTACK_STORAGE_LABEL = 'blockstack'
const BLOCKSTACK_APP_PRIVATE_KEY_LABEL = 'blockstack-transit-private-key'

const DEFAULT_BLOCKSTACK_HOST = 'https://blockstack.org/auth'
const DEFAULT_SCOPE = ['scope_write']

export function generateAndStoreAppKey() {
  const transitKey = makeECPrivateKey()
  localStorage.setItem(BLOCKSTACK_APP_PRIVATE_KEY_LABEL, transitKey)
  return transitKey
}

export function isUserSignedIn() {
  return window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL) ? true : false
}

export function redirectToSignInWithAuthRequest(authRequest = makeAuthRequest(),
                                     blockstackIDHost = DEFAULT_BLOCKSTACK_HOST) {
  const protocolURI = `${BLOCKSTACK_HANDLER}:${authRequest}`
  const httpsURI = `${blockstackIDHost}?authRequest=${authRequest}`
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

export function redirectToSignIn(redirectURI = `${window.location.origin}/`,
                                 manifestURI = `${window.location.origin}/manifest.json`,
                                 scopes = DEFAULT_SCOPE) {
  const authRequest = makeAuthRequest(generateAndStoreAppKey(), redirectURI, manifestURI, scopes)
  redirectToSignInWithAuthRequest(authRequest)
}

export function getAuthResponseToken() {
  const queryDict = queryString.parse(location.search)
  return queryDict.authResponse ? queryDict.authResponse : null
}

export function isSignInPending() {
  return getAuthResponseToken() ? true : false
}

export function handlePendingSignIn() {
  return new Promise((resolve, reject) => {
    const authResponseToken = getAuthResponseToken()

    if (verifyAuthResponse(authResponseToken)) {
      const tokenPayload = decodeToken(authResponseToken).payload
      const userData = {
        username: tokenPayload.username,
        profile: tokenPayload.profile,
        appPrivateKey: tokenPayload.private_key,
        coreSessionToken: tokenPayload.core_token,
        authResponseToken
      }
      window.localStorage.setItem(
        BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
      resolve(userData)
    } else {
      reject(false)
    }
  })
}

export function loadUserData() {
  return new Promise((resolve) => {
    const userData = JSON.parse(window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
    resolve(userData)
  })
}

export function signUserOut(redirectURL) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.location = redirectURL
}
