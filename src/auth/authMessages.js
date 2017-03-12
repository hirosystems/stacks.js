'use strict'

import request from 'request'
import {
  TokenSigner, TokenVerifier, decodeToken, createUnsecuredToken,
  SECP256K1Client
} from 'jsontokens'

import {
  makeDIDFromAddress, getDIDType,
  makeUUID4,
  nextMonth, nextHour,
  publicKeyToAddress
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

function doSignaturesMatchPublicKeys(token) {
  const payload = decodeToken(token).payload
  const publicKeys = payload.publicKeys
  
  if (publicKeys.length !== 1) {
    throw new Error('Multiple public keys are not supported')
  }

  publicKeys.map((publicKey) => {
    const tokenVerifier = new TokenVerifier('ES256k', publicKey)
    const signatureVerified = tokenVerifier.verify(token)
    if (!signatureVerified) {
      return false
    }
  })

  return true
}

function doPublicKeysMatchIssuer(token) {
  const payload = decodeToken(token).payload
  const publicKeys = payload.publicKeys
  const issuer = payload.iss
  const issuerType = getDIDType(issuer)
  const addressFromIssuer = (issuerType === 'btc-addr') ?
    issuer.split(':')[2] : null

  if (publicKeys.length === 1) {
    const addressFromPublicKeys = publicKeyToAddress(publicKeys[0])
    if (addressFromPublicKeys === addressFromIssuer) {
      return true
    }
  } else {
    throw new Error('Multiple public keys are not supported')
  }

  return false
}

function doPublicKeysMatchUsername(token) {
  // Fill in
  return true
}

function isExpirationDateInTheFuture(token) {
  // Fill in
  return true
}

export function verifyAuthRequest(token) {
  const expirationDateIsInTheFuture = isExpirationDateInTheFuture(token)

  if (decodeToken(token).header.alg === 'none') {
    // Token is unsecured
    return (expirationDateIsInTheFuture)
  } else {
    // Token is signed
    const signaturesMatchPublicKeys = doSignaturesMatchPublicKeys(token)
    const publicKeysMatchIssuer = doPublicKeysMatchIssuer(token)
    return (expirationDateIsInTheFuture
            && signaturesMatchPublicKeys
            && publicKeysMatchIssuer)
  }
}

export function verifyAuthResponse(token) {
  const expirationDateIsInTheFuture = isExpirationDateInTheFuture(token)
  const signaturesMatchPublicKeys = doSignaturesMatchPublicKeys(token)
  const publicKeysMatchIssuer = doPublicKeysMatchIssuer(token)
  const publicKeysMatchUsername = doPublicKeysMatchUsername(token)

  return (signaturesMatchPublicKeys
          && publicKeysMatchIssuer
          && publicKeysMatchUsername)
}

/*
    request(requestURL, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        const profile = JSON.parse(body)[username].profile
        
      }
    })
*/