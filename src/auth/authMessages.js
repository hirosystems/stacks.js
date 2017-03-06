'use strict'

import queryString from 'query-string'
import base64url from 'base64url'
import request from 'request'
import { TokenSigner, decodeToken, createUnsecuredToken } from 'jsontokens'
import { SECP256K1Client } from 'jsontokens'

import { makeUUID4, nextMonth, nextHour } from '../utils'
import { makeDIDFromAddress, utils } from '../index'
import { publicKeyToAddress } from '../keys'

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
    publicKey: [],
    manifest: appManifest,
    scopes: scopes
  }

  if (privateKey === null) {
    /* Create an unsecured token and return it */
    token = createUnsecuredToken(payload)
  } else {
    /* Convert the private key to a public key to an issuer */
    const publicKey = SECP256K1Client.derivePublicKey(privateKey)
    payload.publicKey = [publicKey]
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
    publicKey: [publicKey],
    profile: profile,
    username: username
  }
  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}

function verifyAuthMessage(token) {
  const payload = decodeToken(token).payload
  if (publicKey.length === 1) {
    const publicKey = payload.publicKey[0]
    const tokenVerifier = new TokenVerifier('ES256k', publicKey)
    const signatureVerified = tokenVerifier.verify(token)  
    if (!signatureVerified) {
      return false
    }
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