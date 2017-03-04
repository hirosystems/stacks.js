'use strict'

import queryString from 'query-string'
import base64url from 'base64url'
import request from 'request'
import { TokenSigner, decodeToken, createUnsecuredToken } from 'jsontokens'
import { secp256k1 } from 'elliptic-curve'
import { makeUUID4, nextMonth, nextHour } from './utils'
import { makeDIDFromPublicKey, makeDIDFromAddress } from './decentralizedIDs'

export function makeAuthRequest(privateKey,
                                appManifest,
                                scopes=[],
                                expiresAt=nextHour()) {
  let token = null

  /* Create the payload */
  let payload = {
    jti: makeUUID4(),
    iat: new Date().getTime(),
    exp: nextHour(),
    iss: null,
    manifest: appManifest,
    scopes: scopes
  }

  if (privateKey === null) {
    /* Create an unsecured token and return it */
    token = createUnsecuredToken(payload)
  } else {
    /* Convert the private key to a public key to an issuer */
    const publicKey = secp256k1.getPublicKey(privateKey)
    const issuer = makeDIDFromPublicKey(publicKey)
    payload.iss = issuer
    /* Sign and return the token */
    const tokenSigner = new TokenSigner('ES256k', privateKey)
    token = tokenSigner.sign(payload)
  }

  return token
}

export function verifyAuthRequest(token) {
  const decodedToken = decodeToken(token)
  const payload = decodedToken.payload

  const publicKey = payload.iss
  const tokenVerifier = new TokenVerifier('ES256k', publicKey)
  const verified = tokenVerifier.verify(token)

  return false
}

export function makeAuthResponse(privateKey,
                                 profile={},
                                 username=null,
                                 expiresAt=nextMonth()) {
  /* Convert the private key to a public key to an issuer */
  const publicKey = secp256k1.getPublicKey(privateKey)
  const issuer = makeDIDFromPublicKey(publicKey)
  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: new Date().getTime(),
    exp: nextMonth(),
    iss: issuer,
    profile: profile,
    username: username
  }
  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}

const BLOCKSTACK_HANDLER = "web+blockstack"

export class Authenticator {
  constructor(currentHostURL=window.location.origin) {
    this.storageLabel = 'blockstack'
    this.currentHost = currentHostURL
    this.signingKey = null

    this.identityProviderURL = "http://localhost:8888/auth"
  }

  isUserLoggedIn() {
    return window.localStorage.getItem(this.storageLabel) ? true : false
  }

  requestLogin() {
    const authRequest = makeAuthRequest(this.signingKey, this.currentHost)

    setTimeout(function() {
      window.location = this.identityProviderURL + "?authRequest=" + authRequest
    }, 200)

    window.location = BLOCKSTACK_HANDLER + ":" + authRequest
  }

  getAuthResponseToken() {
    const queryDict = queryString.parse(location.search)
    return queryDict.authResponse
  }

  isLoginPending() {
    return this.getAuthResponseToken() ? true : false
  }

  completeLogin(callbackFunction) {
    const authResponseToken = this.getAuthResponseToken()
    const decodedToken = decodeToken(authResponseToken)
    const username = decodedToken.payload.username
    const profile = decodedToken.payload.profile
    
    const session = {
      username: username,
      profile: profile,
      authResponseToken: authResponseToken
    }
    window.localStorage.setItem(this.storageLabel, JSON.stringify(session))
    callbackFunction(session)
  }

  loadSession(callbackFunction) {
    const session = JSON.parse(localStorage.getItem(this.storageLabel))
    callbackFunction(session)
  }

  logout() {
    window.localStorage.removeItem(this.storageLabel)
    window.location = this.currentHost
  }
}

/*
    request(requestURL, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const profile = JSON.parse(body)[username].profile
        
      }
    })
*/