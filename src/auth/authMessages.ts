
import 'cross-fetch/polyfill'

// @ts-ignore: Could not find a declaration file for module
import { TokenSigner, SECP256K1Client } from 'jsontokens'
import { makeECPrivateKey, publicKeyToAddress } from '../keys'
import { makeUUID4, nextMonth, getGlobalObject } from '../utils'
import { makeDIDFromAddress } from '../dids'
import { encryptECIES, decryptECIES } from '../encryption/ec'
import { Logger } from '../logger'
import { DEFAULT_SCOPE, AuthScope } from './authConstants'
import { UserSession } from './userSession'


const VERSION = '1.3.1'

type AuthMetadata = {
  email?: string,
  profileUrl?: string
}

/**
 * Generates a ECDSA keypair to
 * use as the ephemeral app transit private key
 * @param {SessionData} session - session object in which key will be stored
 * @return {String} the hex encoded private key
 * @private
 * @ignore
 */
export function generateTransitKey() {
  const transitKey = makeECPrivateKey()
  return transitKey
}


/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in. This authentication request can
 * then be used for sign in by passing it to the `redirectToSignInWithAuthRequest`
 * method.
 *
 * *Note: This method should only be used if you want to roll your own authentication
 * flow. Typically you'd use `redirectToSignIn` which takes care of this
 * under the hood.*
 *
 * @param  {String} transitPrivateKey - hex encoded transit private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @param {Object} extraParams - Any extra parameters you'd like to pass to the authenticator.
 * Use this to pass options that aren't part of the Blockstack auth spec, but might be supported
 * by special authenticators.
 * @return {String} the authentication request
 */
export function makeAuthRequest(
  transitPrivateKey?: string,
  redirectURI?: string, 
  manifestURI?: string, 
  scopes: Array<AuthScope | string> = DEFAULT_SCOPE.slice(),
  appDomain?: string,
  expiresAt: number = nextMonth().getTime(),
  extraParams: any = {}
): string {
  if (!transitPrivateKey) {
    transitPrivateKey = new UserSession().generateAndStoreTransitKey()
  }

  const getWindowOrigin = (paramName: string) => {
    const location = getGlobalObject('location', { 
      throwIfUnavailable: true, 
      usageDesc: `makeAuthRequest([${paramName}=undefined])` 
    })
    return location.origin
  }
  
  if (!redirectURI) {
    redirectURI = `${getWindowOrigin('redirectURI')}/`
  }
  if (!manifestURI) {
    manifestURI = `${getWindowOrigin('manifestURI')}/manifest.json`
  }
  if (!appDomain) {
    appDomain = getWindowOrigin('appDomain')
  }

  /* Create the payload */
  const payload = Object.assign({}, extraParams, {
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
  })

  Logger.info(`blockstack.js: generating v${VERSION} auth request`)

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

/**
 * Encrypts the private key for decryption by the given
 * public key.
 * @param  {String} publicKey  [description]
 * @param  {String} privateKey [description]
 * @return {String} hex encoded ciphertext
 * @private
 * @ignore
 */
export function encryptPrivateKey(publicKey: string,
                                  privateKey: string): string | null {
  const encryptedObj = encryptECIES(publicKey, privateKey)
  const encryptedJSON = JSON.stringify(encryptedObj)
  return (Buffer.from(encryptedJSON)).toString('hex')
}

/**
 * Decrypts the hex encrypted private key
 * @param  {String} privateKey  the private key corresponding to the public
 * key for which the ciphertext was encrypted
 * @param  {String} hexedEncrypted the ciphertext
 * @return {String}  the decrypted private key
 * @throws {Error} if unable to decrypt
 *
 * @private
 * @ignore
 */
export function decryptPrivateKey(privateKey: string,
                                  hexedEncrypted: string): string | null {
  const unhexedString = Buffer.from(hexedEncrypted, 'hex').toString()
  const encryptedObj = JSON.parse(unhexedString)
  const decrypted = decryptECIES(privateKey, encryptedObj)
  if (typeof decrypted !== 'string') {
    throw new Error('Unable to correctly decrypt private key')
  } else {
    return decrypted
  }
}

/**
 * Generates a signed authentication response token for an app. This
 * token is sent back to apps which use contents to access the
 * resources and data requested by the app.
 *
 * @param  {String} privateKey the identity key of the Blockstack ID generating
 * the authentication response
 * @param  {Object} profile the profile object for the Blockstack ID
 * @param  {String} username the username of the Blockstack ID if any, otherwise `null`
 * @param  {AuthMetadata} metadata an object containing metadata sent as part of the authentication
 * response including `email` if requested and available and a URL to the profile
 * @param  {String} coreToken core session token when responding to a legacy auth request
 * or `null` for current direct to gaia authentication requests
 * @param  {String} appPrivateKey the application private key. This private key is
 * unique and specific for every Blockstack ID and application combination.
 * @param  {Number} expiresAt an integer in the same format as
 * `new Date().getTime()`, milliseconds since the Unix epoch
 * @param {String} transitPublicKey the public key provide by the app
 * in its authentication request with which secrets will be encrypted
 * @param {String} hubUrl URL to the write path of the user's Gaia hub
 * @param {String} blockstackAPIUrl URL to the API endpoint to use
 * @param {String} associationToken JWT that binds the app key to the identity key
 * @return {String} signed and encoded authentication response token
 * @private
 * @ignore
 */
export function makeAuthResponse(privateKey: string,
                                 profile: {} = {},
                                 username: string = null,
                                 metadata: AuthMetadata,
                                 coreToken: string = null,
                                 appPrivateKey: string = null,
                                 expiresAt: number = nextMonth().getTime(),
                                 transitPublicKey: string = null,
                                 hubUrl: string = null,
                                 blockstackAPIUrl: string = null,
                                 associationToken: string = null): string {
  /* Convert the private key to a public key to an issuer */
  const publicKey = SECP256K1Client.derivePublicKey(privateKey)
  const address = publicKeyToAddress(publicKey)

  /* See if we should encrypt with the transit key */
  let privateKeyPayload = appPrivateKey
  let coreTokenPayload = coreToken
  let additionalProperties = {}
  if (appPrivateKey !== undefined && appPrivateKey !== null) {
    Logger.info(`blockstack.js: generating v${VERSION} auth response`)
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
      blockstackAPIUrl,
      associationToken,
      version: VERSION
    }
  } else {
    Logger.info('blockstack.js: generating legacy auth response')
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
