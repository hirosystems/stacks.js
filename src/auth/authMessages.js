'use strict'

import queryString from 'query-string'
import base64url from 'base64url'
import request from 'request'
import {
  TokenSigner, TokenVerifier, decodeToken, createUnsecuredToken,
  SECP256K1Client
  } from 'jsontokens'

import {
  makeDIDFromAddress, makeUUID4, nextMonth, nextHour, publicKeyToAddress
} from '../index'

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
    publicKeys: [],
    appManifest: appManifest,
    scopes: scopes
  }

  if (privateKey === null) {
    /* Create an unsecured token and return it */
    token = createUnsecuredToken(payload)
  } else {
    /* Convert the private key to a public key to an issuer */
    const publicKey = SECP256K1Client.derivePublicKey(privateKey)
    payload.publicKeys = [publicKey]
    const address = publicKeyToAddress(publicKey)
    payload.iss = makeDIDFromAddress(address)
    /* Sign and return the token */
    const tokenSigner = new TokenSigner('ES256k', privateKey)
    token = tokenSigner.sign(payload)
  }

  return token
}

export function makeAuthResponse(privateKey,
                             profile={},
                             username=null,
                             expiresAt=nextMonth()) {
  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)
  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: new Date().getTime(),
    exp: nextMonth(),
    iss: makeDIDFromAddress(address),
    publicKeys: [publicKey],
    profile: profile,
    username: username
  }
  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}

function verifyAuthMessage(token) {
  const payload = decodeToken(token).payload
  const publicKeys = payload.publicKeys
  if (publicKeys.length === 1) {
    publicKeys.map((publicKey) => {
      const tokenVerifier = new TokenVerifier('ES256k', publicKey)
      const signatureVerified = tokenVerifier.verify(token)
      if (!signatureVerified) {
        return false
      }
    })
  } else {
    throw new Error('Invalid public key array')
  }

  return true
}

export function verifyAuthRequest(token) {
  return verifyAuthMessage(token)
}

export function verifyAuthResponse(token) {
  return verifyAuthMessage(token)
}

/*
    request(requestURL, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const profile = JSON.parse(body)[username].profile
        
      }
    })
*/