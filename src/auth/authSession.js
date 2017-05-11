import http from 'http'
import urlparse from 'url'
import { TokenSigner, decodeToken, SECP256K1Client } from 'jsontokens'
import { getAuthRequestFromURL } from './authProvider'

/*
 * Create an authentication token to be sent to the Core API server
 * in order to generate a Core session JWT.
 *
 * @param appDomain (String) The unique application identifier (e.g. foo.app, www.foo.com, etc).
 * @param appMethods (Array) The list of API methods this application will need.
 * @param appPrivateKey (String) The application-specific private key
 * @param blockchainIds (Array) Optional; if given, this is the list of blockchain
 *        IDs for which this session identifies.
 *
 * Returns a JWT signed by the app's private key
 */
export function makeCoreSessionRequest(appDomain, appMethods, appPrivateKey,
                                       blockchainIds = null) {
  const appPublicKey = SECP256K1Client.derivePublicKey(appPrivateKey)
  const authBody = {
    app_domain: appDomain,
    methods: appMethods,
    app_public_key: appPublicKey
  }

  if (blockchainIds) {
    authBody.blockchain_ids = blockchainIds
  }

   // make token
  const tokenSigner = new TokenSigner('ES256k', appDomain)
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
      method: 'GET',
      host: coreHost,
      port: corePort,
      path: `/v1/auth?authRequest=${coreAuthRequest}`,
      headers: {
        Authorization: `bearer ${apiPassword}`
      }
    }

    const req = http.request(options,  (response) => {
      const stringBuffer = []
      response.on('data', (chunk) => {
        stringBuffer.push(chunk)
      })

      response.on('end', () => {
        if (response.statusCode !== 200) {
          reject(`HTTP status ${response.statusCode}`)
          return null
        }

        const str = Buffer.concat(stringBuffer).toString()
        let resp = null
        try {
          resp = JSON.parse(str)
        } catch (e) {
          console.log(e.stack)
          reject('Invalid Core response: not JSON')
          return null
        }

        const token = resp.token
        if (!token) {
          reject('Failed to get Core session token')
          return null
        }
        
        resolve(token)
      })
    })

    req.end()
  })
}


/*
 * Get a core session token.  Generate an auth request, sign it, send it to Core,
 * and get back a session token.
 *
 * @param coreHost (String) Core API server's hostname
 * @param corePort (Integer) Core API server's port number
 * @param appPrivateKey (String) Application's private key
 * @param userBlockchainId (String) Optional; blockchain ID of the user signing in.
 *
 * Returns a Promise that resolves to a Core session token.
 */
export function getCoreSession(coreHost, corePort, apiPassword, appPrivateKey,
                               userBlockchainId = null, authRequest = null) {
  if (!authRequest) {
       // try from url?
    authRequest = getAuthRequestFromURL()
  }

  if (!authRequest) {
    return Promise.reject('No authRequest in URL query string')
  }

  let payload = null
  try {
    const authRequestObject = decodeToken(authRequest)
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

  const appDomain = urlparse.parse(payload.domain_name).host
  const appMethods = payload.scopes
  let blockchainIds = null
  if (userBlockchainId) {
    blockchainIds = [userBlockchainId]
  }

  const coreAuthRequest = makeCoreSessionRequest(
      appDomain, appMethods, appPrivateKey, blockchainIds)
  return sendCoreSessionRequest(
      coreHost, corePort, coreAuthRequest, apiPassword)
}
