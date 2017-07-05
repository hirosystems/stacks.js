/* @flow */
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
} from './authConstants'

/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in.
 * @param  {String} [transitPrivateKey=generateAndStoreAppKey()] - hex encoded app private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @return {String} the authentication request
 */
export function makeAuthRequest(transitPrivateKey: string = generateAndStoreAppKey(),
                                redirectURI: string = `${window.location.origin}/`,
                                manifestURI: string = `${window.location.origin}/manifest.json`,
                                scopes: Array<String> = DEFAULT_SCOPE,
                                appDomain: string = window.location.origin,
                                expiresAt: number = nextHour().getTime()): string {
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

export function makeAuthResponse(privateKey: string,
                                 profile: {} = {},
                                 username: ?string = null,
                                 coreToken: ?string = null,
                                 appPrivateKey: ?string = null,
                                 expiresAt: number = nextMonth().getTime()): string {
  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)

  /* Create the payload */
  const payload = {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime() / 1000), // JWT times are in seconds
    exp: Math.floor(expiresAt / 1000), // JWT times are in seconds
    iss: makeDIDFromAddress(address),
    private_key: appPrivateKey,
    public_keys: [publicKey],
    profile,
    username,
    core_token: coreToken
  }

  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}
