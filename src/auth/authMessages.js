'use strict'

require('isomorphic-fetch')

import {
  TokenSigner, TokenVerifier, decodeToken, createUnsecuredToken,
  SECP256K1Client
} from 'jsontokens'

import {
  makeDIDFromAddress, getDIDType, getAddressFromDID, makeUUID4,
  nextMonth, nextHour, publicKeyToAddress
} from '../index'

export function makeAuthRequest(privateKey, domain_name, manifestURI=null,
                                redirectURI=null, scopes=[],
                                expiresAt=nextHour().getTime()) {
  let token = null

  if (domain_name === null) {
    throw new Error("Invalid app domain name")
  }
  if (manifestURI === null) {
    manifestURI = `${window.location.origin}/manifest.json`
  }
  if (redirectURI === null) {
    redirectURI = window.location.href
  }

  /* Create the payload */
  let payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime()/1000), // JWT times are in seconds
    exp: Math.floor(expiresAt/1000), // JWT times are in seconds
    iss: null,
    public_keys: [],
    domain_name: domain_name,
    manifest_uri: manifestURI,
    redirect_uri: redirectURI,
    scopes: scopes
  }

  if (privateKey === null) {
    /* Create an unsecured token and return it */
    token = createUnsecuredToken(payload)
  } else {
    /* Convert the private key to a public key to an issuer */
    const publicKey = SECP256K1Client.derivePublicKey(privateKey)
    payload.public_keys = [publicKey]
    const address = publicKeyToAddress(publicKey)
    payload.iss = makeDIDFromAddress(address)
    /* Sign and return the token */
    const tokenSigner = new TokenSigner('ES256k', privateKey)
    token = tokenSigner.sign(payload)
  }

  return token
}

export function makeAuthResponse(privateKey, profile={}, username=null,
                                 coreToken=null,
                                 expiresAt=nextMonth().getTime()) {

  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)

  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime()/1000), // JWT times are in seconds
    exp: Math.floor(expiresAt/1000), // JWT times are in seconds
    iss: makeDIDFromAddress(address),
    public_keys: [publicKey],
    profile: profile,
    username: username,
    core_token: coreToken
  }

  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}
