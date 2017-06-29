require('isomorphic-fetch')

import {
  TokenSigner,
  SECP256K1Client
} from 'jsontokens'

import {
  makeDIDFromAddress, generateAndStoreAppKey, makeUUID4,
  nextMonth, nextHour, publicKeyToAddress
} from '../index'

import {
  DEFAULT_SCOPE
} from './authApp'

export function makeAuthRequest(transitPrivateKey = generateAndStoreAppKey(),
                                redirectURI = `${window.location.origin}/`,
                                manifestURI = `${window.location.origin}/manifest.json`,
                                scopes = DEFAULT_SCOPE,
                                appDomain = window.location.origin,
                                expiresAt = nextHour().getTime()) {
  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime() / 1000), // JWT times are in seconds
    exp: Math.floor(expiresAt / 1000), // JWT times are in seconds
    iss: null,
    public_keys: [],
    domain_name: appDomain,
    manifest_uri: manifestURI,
    redirect_uri: redirectURI,
    scopes
  }

  console.log(payload)

  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(transitPrivateKey)
  payload.public_keys = [publicKey]
  const address = publicKeyToAddress(publicKey)
  payload.iss = makeDIDFromAddress(address)

  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', transitPrivateKey)
  const token = tokenSigner.sign(payload)

  return token
}

export function makeAuthResponse(privateKey, profile={}, username=null,
                                 coreToken=null, appPrivateKey=null,
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
    private_key: appPrivateKey,
    public_keys: [publicKey],
    profile: profile,
    username: username,
    core_token: coreToken
  }

  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}
