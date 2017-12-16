/* @flow */
require('isomorphic-fetch')

import {
  TokenSigner,
  SECP256K1Client
} from 'jsontokens'

import {
  makeDIDFromAddress, generateAndStoreTransitKey, makeUUID4,
  nextMonth, nextHour, publicKeyToAddress
} from '../index'

import {
  DEFAULT_SCOPE
} from './authConstants'

import { encryptECIES, decryptECIES } from '../encryption'

const VERSION = '1.1.0'

type AuthMetadata = {
  email: ?string,
  profileUrl: ?string
}

/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in.
 * @param  {String} [transitPrivateKey=generateAndStoreTransitKey()] - hex encoded transit
 *   private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @return {String} the authentication request
 */
export function makeAuthRequest(transitPrivateKey: string = generateAndStoreTransitKey(),
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
    version: VERSION,
    do_not_include_profile: true,
    supports_hub_url: true,
    scopes
  }

  console.log(`blockstack.js: generating v${VERSION} auth request`)

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

export function encryptPrivateKey(publicKey: string,
                                  privateKey: string): string | null {
  const encryptedObj = encryptECIES(publicKey, privateKey)
  const encryptedJSON = JSON.stringify(encryptedObj)
  return (new Buffer(encryptedJSON)).toString('hex')
}

export function decryptPrivateKey(privateKey: string,
                                  hexedEncrypted: string): string | null {
  const unhexedString = new Buffer(hexedEncrypted, 'hex').toString()
  const encryptedObj = JSON.parse(unhexedString)
  return decryptECIES(privateKey, encryptedObj)
}

export function makeAuthResponse(privateKey: string,
                                 profile: {} = {},
                                 username: ?string = null,
                                 metadata: AuthMetadata,
                                 coreToken: ?string = null,
                                 appPrivateKey: ?string = null,
                                 expiresAt: number = nextMonth().getTime(),
                                 transitPublicKey: ?string = null,
                                 hubUrl: ?string = null): string {
  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)

  /* See if we should encrypt with the transit key */
  let privateKeyPayload = appPrivateKey
  let coreTokenPayload = coreToken
  let additionalProperties = {}
  if (appPrivateKey !== undefined && appPrivateKey !== null) {
    console.log(`blockstack.js: generating v${VERSION} auth response`)
    if (transitPublicKey !== undefined && transitPublicKey !== null) {
      privateKeyPayload = encryptPrivateKey(transitPublicKey, appPrivateKey)
      if (coreToken !== undefined && coreToken !== null) {
        coreTokenPayload = encryptPrivateKey(transitPublicKey, coreToken)
      }
    }
    additionalProperties = {
      email: metadata.email ? metadata.email : null,
      profile_url: metadata.profileUrl ? metadata.profileUrl : null,
      hubUrl,
      version: VERSION
    }
  } else {
    console.log('blockstack.js: generating legacy auth response')
  }

  /* Create the payload */
  const payload = Object.assign({}, {
    jti: makeUUID4(),
    iat: Math.floor(new Date().getTime() / 1000), // JWT times are in seconds
    exp: Math.floor(expiresAt / 1000), // JWT times are in seconds
    iss: makeDIDFromAddress(address),
    private_key: privateKeyPayload,
    public_keys: [publicKey],
    profile,
    username,
    core_token: coreTokenPayload
  }, additionalProperties)

  /* Sign and return the token */
  const tokenSigner = new TokenSigner('ES256k', privateKey)
  return tokenSigner.sign(payload)
}
