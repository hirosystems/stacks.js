'use strict'

import queryString from 'query-string'
import { TokenSigner, decodeToken, SECP256K1Client } from 'jsontokens'
import { makeAuthRequest, verifyAuthResponse } from './authMessages'
import { updateQueryStringParameter } from '../index'
import protocolCheck from 'custom-protocol-detection'
import inspector from 'schema-inspector';

const BLOCKSTACK_HANDLER = "blockstack"
const BLOCKSTACK_STORAGE_LABEL = "blockstack"
const DEFAULT_BLOCKSTACK_HOST = "https://blockstack.org/auth"

const http = require('http');
const urlparse = require('url');

/**
 * For applications
 */

export function isUserSignedIn() {
  return window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL) ? true : false
}

export function redirectUserToSignIn(authRequest,
                                     blockstackIDHost=DEFAULT_BLOCKSTACK_HOST) {
  const protocolURI = BLOCKSTACK_HANDLER + ":" + authRequest
  const httpsURI = blockstackIDHost + "?authRequest=" + authRequest

  protocolCheck(protocolURI, () => {
    console.log('protocol handler not detected')
    window.location = httpsURI
  }, () => {
    console.log('protocol handler detected')
  })
}

export function getAuthResponseToken() {
  const queryDict = queryString.parse(location.search)
  return queryDict.authResponse ? queryDict.authResponse : null
}

export function isSignInPending() {
  return getAuthResponseToken() ? true : false
}

export function signUserIn(callbackFunction) {
  const authResponseToken = getAuthResponseToken()

  if (verifyAuthResponse(authResponseToken)) {
    const tokenPayload = decodeToken(authResponseToken).payload
    const userData = {
      username: tokenPayload.username,
      profile: tokenPayload.profile,
      authResponseToken: authResponseToken
    }
    window.localStorage.setItem(
      BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))
    callbackFunction(true)
  } else {
    callbackFunction(false)
  }
}

export function loadUserData(callbackFunction) {
  const userData = JSON.parse(window.localStorage.getItem(BLOCKSTACK_STORAGE_LABEL))
  callbackFunction(userData)
}

export function signUserOut(redirectURL) {
  window.localStorage.removeItem(BLOCKSTACK_STORAGE_LABEL)
  window.location = redirectURL
}


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
export function makeCoreSessionRequest(app_domain, app_methods, app_privkey, blockchain_ids=null) {
   const app_public_key = SECP256K1Client.derivePublicKey(app_privkey);
   var authBody = {
      'app_domain': app_domain,
      'methods': app_methods,
      'app_public_key': app_public_key
   };

   if( blockchain_ids ) {
      authBody['blockchain_ids'] = blockchain_ids;
   }

   // make token
   const tokenSigner = new TokenSigner('ES256k', app_privkey);
   const token = tokenSigner.sign(authBody);

   return token;
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
export function sendCoreSessionRequest(core_host, core_port, core_auth_request, api_password) {
  return new Promise((resolve, reject) => {
     if( !api_password ) {
        reject("Missing API password");
        return null;
     }
     
     var options = {
        'method': 'GET',
        'host': core_host, 
        'port': core_port,
        'path': `/v1/auth?authRequest=${core_auth_request}`,
        'headers': {
           'Authorization': `bearer ${api_password}`,
        },
     };

     var req = http.request( options, function(response) {
        var strbuf = [];
        response.on('data', function(chunk) {
           strbuf.push(chunk);
        });

        response.on('end', function() {
           if( response.statusCode != 200 ) {
               reject(`HTTP status ${response.statusCode}`);
               return null;
           }

           var str = Buffer.concat(strbuf).toString();
           var resp = null;
           try {
              resp = JSON.parse(str);
           }
           catch(e) {
              console.log(e.stack);
              reject("Invalid Core response: not JSON");
              return null;
           }
           
           var token = resp.token;
           if( !token ) {
              reject("Failed to get Core session token");
              return null;
           }

           resolve(token);
        });
     });
     
     req.end();
  });
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
export function getCoreSession(core_host, core_port, api_password, app_privkey, user_blockchain_id=null, auth_request=null) {

    if( !auth_request ) {
       // try from url?
       auth_request = getAuthRequestFromURL();
    }

    if( !auth_request ) {
       return new Promise((resolve, reject) => {reject("No authRequest in URL query string");});
    }
 
    var payload = null;
    try {
        const auth_request_obj = decodeToken(auth_request);
        if( !auth_request_obj ) {
           return new Promise((resolve, reject) => {reject("Invalid authRequest in URL query string");});
        }
 
        if( !auth_request_obj.payload ) {
           return new Promise((resolve, reject) => {reject("Invalid authRequest in URL query string");});
        }

        payload = auth_request_obj.payload;
    }
    catch(e) {
        console.log(e.stack);
        return new Promise((resolve, reject) => {reject("Failed to parse authRequest in URL");});
    }

    var app_domain = urlparse.parse(payload.domain_name).host;
    var app_methods = payload.scopes;
    var blockchain_ids = null;
    if( user_blockchain_id ) {
       blockchain_ids = [user_blockchain_id];
    }
    
    var core_auth_request = makeCoreSessionRequest(app_domain, app_methods, app_privkey, blockchain_ids);
    return sendCoreSessionRequest(core_host, core_port, core_auth_request, api_password);
}


/**
 * For identity providers
 */

export function getAuthRequestFromURL() {
  const queryDict = queryString.parse(location.search)
  if (queryDict.authRequest !== null && queryDict.authRequest !== undefined) {
    return queryDict.authRequest.split(BLOCKSTACK_HANDLER + ':').join('')
  } else {
    return null
  }
}

export function fetchAppManifest(authRequest) {
  return new Promise((resolve, reject) => {
    if (!authRequest) {
      reject("Invalid auth request")
    } else {
      const payload = decodeToken(authRequest).payload
      const manifestURI = payload.manifest_uri
      try {
        fetch(manifestURI)
          .then(response => response.text())
          .then(responseText => JSON.parse(responseText))
          .then(responseJSON => {
            resolve(responseJSON)
          })
          .catch((e) => {
            console.log(e.stack)
            reject("URI request couldn't be completed")
          })
      } catch(e) {
        console.log(e.stack)
        reject("URI request couldn't be completed")
      }
    }
  })
}

export function redirectUserToApp(authRequest, authResponse) {
  const payload = decodeToken(authRequest).payload
  let redirectURI = payload.redirect_uri
  if (redirectURI) {
    redirectURI = updateQueryStringParameter(redirectURI, 'authResponse', authResponse)
  } else {
    throw new Error("Invalid redirect URI")
  }
  window.location = redirectURI
}
