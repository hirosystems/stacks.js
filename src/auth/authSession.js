import urlparse from 'url'
import { TokenSigner, decodeToken, SECP256K1Client } from 'jsontokens'
import { getAuthRequestFromURL } from './authProvider'
import fetch from 'isomorphic-fetch'
/*
 * Create an authentication token to be sent to the Core API server
 * in order to generate a Core session JWT.
 *
 * @param appDomain (String) The unique application identifier (e.g. foo.app, www.foo.com, etc).
 * @param appMethods (Array) The list of API methods this application will need.
 * @param appPrivateKey (String) The application-specific private key
 * @param blockchainId (String) This is the blockchain ID of the requester
 *
 * Returns a JWT signed by the app's private key
 */
export function makeCoreSessionRequest(appDomain, appMethods, appPrivateKey, blockchainID) {

  const appPublicKey = SECP256K1Client.derivePublicKey(appPrivateKey)
  const authBody = {
    version: 1,
    app_domain: appDomain,
    methods: appMethods,
    app_public_key: appPublicKey,
    blockchain_id: blockchainID
  }

  // make token
  const tokenSigner = new TokenSigner('ES256k', appPrivateKey)
  const token = tokenSigner.sign(authBody)

  return token
}


/*
 * Send Core a request for a session token.
 *
 * @param coreAuthRequest (String) a signed JWT encoding the authentication request
 * @param apiPassword (String) the API password for Core
 *
 * Returns a JWT signed with the Core API server's private key that authorizes the bearer
 * to carry out the requested operations.
 */
export function sendCoreSessionRequest(coreHost, corePort, coreAuthRequest,
                                       apiPassword) {
  return new Promise((resolve, reject) => {
    if (!apiPassword) {
      reject('Missing API password')
      return null
    }

    const options = {
      headers: {
        Authorization: `bearer ${apiPassword}`
      }
    }

    const url = `http://${coreHost}:${corePort}/v1/auth?authRequest=${coreAuthRequest}`

    return fetch(url, options)
    .then(response => {
      if (!response.ok) {
        reject('HTTP status not OK')
        return null
      }
      return response.text()
    })
    .then(responseText => JSON.parse(responseText))
    .then(responseJson => {
      const token = responseJson.token
      if (!token) {
        reject('Failed to get Core session token')
        return null
      }
      resolve(token)
      return token
    })
    .catch(error => {
      console.error(error)
      reject('Invalid Core response: not JSON')
    })
  })
}


/*
 * Get a core session token.  Generate an auth request, sign it, send it to Core,
 * and get back a session token.
 *
 * @param coreHost (String) Core API server's hostname
 * @param corePort (Integer) Core API server's port number
 * @param appPrivateKey (String) Application's private key
 * @param blockchainId (String) blockchain ID of the user signing in.
 *
 * Returns a Promise that resolves to a Core session token.
 */
export function getCoreSession(coreHost, corePort, apiPassword, appPrivateKey,
                               blockchainId, authRequest = null) {
  if (!authRequest) {
       // try from url?
    authRequest = getAuthRequestFromURL()
  }

  if (!authRequest) {
    return Promise.reject('No authRequest in URL query string')
  }

  let payload = null
  let authRequestObject = null
  try {
    authRequestObject = decodeToken(authRequest)
    if (!authRequestObject) {
      return Promise.reject('Invalid authRequest in URL query string')
    }
    if (!authRequestObject.payload) {
      return Promise.reject('Invalid authRequest in URL query string')
    }
    payload = authRequestObject.payload
  } catch (e) {
    console.error(e.stack)
    return Promise.reject('Failed to parse authRequest in URL')
  }

  const appDomain = payload.domain_name
  if (!appDomain) {
    return Promise.reject('No domain_name in authRequest')
  }
  const appMethods = payload.scopes

  const coreAuthRequest = makeCoreSessionRequest(
      appDomain, appMethods, appPrivateKey, blockchainId)

  return sendCoreSessionRequest(
      coreHost, corePort, coreAuthRequest, apiPassword)
}
