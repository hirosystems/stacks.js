'use strict'

import http from 'http'
import urlparse from 'url'
import inspector from 'schema-inspector'
import { TokenSigner, decodeToken, SECP256K1Client } from 'jsontokens'

/*
 * Create an authentication token to be sent to the Core API server
 * in order to generate a Core session JWT.
 *
 * @param app_domain (String) The unique application identifier (e.g. foo.app, www.foo.com, etc).
 * @param app_methods (Array) The list of API methods this application will need.
 * @param app_privkey (String) The application-specific private key
 * @param blockchain_ids (Array) Optional; if given, this is the list of blockchain IDs for which this session identifies.
 *
 * Returns a JWT signed by the app's private key
 */
export function makeCoreSessionRequest(app_domain, app_methods, app_privkey,
                                       blockchain_ids=null) {
   const app_public_key = SECP256K1Client.derivePublicKey(app_privkey)
   let authBody = {
      'app_domain': app_domain,
      'methods': app_methods,
      'app_public_key': app_public_key
   }

   if (blockchain_ids) {
      authBody['blockchain_ids'] = blockchain_ids
   }

   // make token
   const tokenSigner = new TokenSigner('ES256k', app_privkey)
   const token = tokenSigner.sign(authBody)

   return token
}


/*
 * Send Core a request for a session token.
 *
 * @param core_auth_request (String) a signed JWT encoding the authentication request
 * @param api_password (String) the API password for Core
 *
 * Returns a JWT signed with the Core API server's private key that authorizes the bearer
 * to carry out the requested operations.
 */
export function sendCoreSessionRequest(core_host, core_port, core_auth_request,
                                       api_password) {
  return new Promise((resolve, reject) => {
    if (!api_password) {
      reject("Missing API password")
      return null
    }

    const options = {
      'method': 'GET',
      'host': core_host,
      'port': core_port,
      'path': `/v1/auth?authRequest=${core_auth_request}`,
      'headers': {
         'Authorization': `bearer ${api_password}`,
      }
    }

    let req = http.request(options, function(response) {
      let strbuf = []
      response.on('data', function(chunk) {
        strbuf.push(chunk)
      })

      response.on('end', function() {
        if (response.statusCode != 200) {
          reject(`HTTP status ${response.statusCode}`)
          return null
        }

        let str = Buffer.concat(strbuf).toString()
        let resp = null
        try {
          resp = JSON.parse(str)
        } catch(e) {
          console.log(e.stack)
          reject("Invalid Core response: not JSON")
          return null
        }

        let token = resp.token
        if (!token) {
          reject("Failed to get Core session token")
          return null
        }

        resolve(token)
      })
    })
     
    req.end()
  })
}


/*
 * Get a core session token.  Generate an auth request, sign it, send it to Core, and get back a session token.
 *
 * @param core_host (String) Core API server's hostname
 * @param core_port (Integer) Core API server's port number
 * @param app_privkey (String) Application's private key
 * @param user_blockchain_id (String) Optional; blockchain ID of the user signing in.
 *
 * Returns a Promise that resolves to a Core session token.
 */
export function getCoreSession(core_host, core_port, api_password, app_privkey,
                               user_blockchain_id=null, auth_request=null) {

    if (!auth_request) {
       // try from url?
      auth_request = getAuthRequestFromURL()
    }

    if (!auth_request) {
      return new Promise((resolve, reject) => {
        reject("No authRequest in URL query string")
      })
    }
 
    let payload = null;
    try {
      const auth_request_obj = decodeToken(auth_request)
      if (!auth_request_obj) {
        return new Promise((resolve, reject) => {
          reject("Invalid authRequest in URL query string")
        })
      }
      if (!auth_request_obj.payload) {
        return new Promise((resolve, reject) => {
          reject("Invalid authRequest in URL query string")
        })
      }
      payload = auth_request_obj.payload
    } catch(e) {
      console.log(e.stack)
      return new Promise((resolve, reject) => {
        reject("Failed to parse authRequest in URL")
      })
    }

    const app_domain = urlparse.parse(payload.domain_name).host
    const app_methods = payload.scopes
    let blockchain_ids = null
    if (user_blockchain_id) {
       blockchain_ids = [user_blockchain_id]
    }
    
    const core_auth_request = makeCoreSessionRequest(
      app_domain, app_methods, app_privkey, blockchain_ids)
    return sendCoreSessionRequest(
      core_host, core_port, core_auth_request, api_password)
}
