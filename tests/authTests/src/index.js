// This test is meant to be run from the integration test framework
// see https://github.com/blockstack/blockstack-core/tree/master/integration_tests

import {
    getCoreSession,
    makeAuthRequest
} from '../../../lib'

const assert = require('assert')
const jsontokens = require('jsontokens')

const clientPrivateKey = '8b13483d65e55eb2184ff7c9978379eff2fae7ad40da09ae4e3e5cf84b36a550'
const appPrivateKey = '99c01d085f7914e4725ffa3160df583c37cc27e1e7fd48f2d6e17d4a9a4ba55e'
const apiPassword = 'blockstack_integration_test_api_password'

const authRequest = makeAuthRequest(clientPrivateKey,
'https://www.foo.com/manifest.json', 'https://www.foo.com/login',
['store_read', 'store_write', 'store_admin'], "www.foo.com")


/*
 * Send Core a request for a session token.
 * This duplicates the functionality of sendCoreSessionRequest(), but in a way
 * that is compatible with the integration test framework.  In particular,
 * it sets the Origin: header.
 *
 * @param coreAuthRequest (String) a signed JWT encoding the authentication request
 * @param apiPassword (String) the API password for Core
 *
 * Returns a JWT signed with the Core API server's private key that authorizes the bearer
 * to carry out the requested operations.
 * @private
 */
function sendCoreSessionRequestTEST(coreHost: string,
                                    corePort: number,
                                    coreAuthRequest: string,
                                    apiPassword: string) {

  return new Promise((resolve, reject) => {
    if (!apiPassword) {
      reject('Missing API password')
      return null
    }

    const options = {
      headers: {
        Authorization: `bearer ${apiPassword}`,
        Origin: `http://localhost:${corePort}`
      }
    }

    const url = `http://${coreHost}:${corePort}/v1/auth?authRequest=${coreAuthRequest}`
    console.log(`sendCoreSesionRequestTEST: Fetch ${url}`);

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


console.log("Log in with a blockchain ID")
getCoreSession('localhost', 16268, apiPassword, appPrivateKey, 'judecn.id', authRequest, '0', sendCoreSessionRequestTEST)
.then((session) => {
  console.log('success!')
  console.log(session)

   // inspect session
  const token = jsontokens.decodeToken(session)
  const payload = token.payload

  console.log(JSON.stringify(payload));

  assert(payload.app_domain === 'www.foo.com')

  assert(payload.methods[0] === 'store_read')
  assert(payload.methods[1] === 'store_write')
  assert(payload.methods[2] === 'store_admin')
  assert(payload.methods.length === 3)

  assert(payload.app_public_keys.length == 1)
  assert(payload.app_public_keys[0]['public_key'] === jsontokens.SECP256K1Client.derivePublicKey(appPrivateKey))

  assert(payload.blockchain_id === 'judecn.id')
  return true
}, (error) => {
  console.error('failure!')
  console.log(error)
  console.error(error.stack)
  process.exit(1)
})
.then((res) => {
   if (!res) {
      throw new Error("Failed to log in with blockchain ID");
   }

   console.log("Log in without a blockchain ID");
   // try with no blockchain ID
   return getCoreSession('localhost', 16268, apiPassword, appPrivateKey, null, authRequest, '0', sendCoreSessionRequestTEST)
}, (error) => {
    console.log("failure!")
    console.log(error)
    cosnole.log(error.stack)
    process.exit(1)
})
.then((session) => {
   console.log('success!')
   console.log(session)

   // inspect session
   const token = jsontokens.decodeToken(session)
   const payload = token.payload

   console.log(JSON.stringify(payload));

   assert(payload.app_domain === 'www.foo.com')

   assert(payload.methods[0] === 'store_read')
   assert(payload.methods[1] === 'store_write')
   assert(payload.methods[2] === 'store_admin')
   assert(payload.methods.length === 3)

   assert(payload.app_public_keys.length == 1)
   assert(payload.app_public_keys[0]['public_key'] === jsontokens.SECP256K1Client.derivePublicKey(appPrivateKey))

   assert(payload.blockchain_id === null)
   return true
}, (e) => {
   console.log("failure!")
   console.log(e)
   console.log(e.stack)
   process.exit(1)
})
.then(() => {
  process.exit(0)
}, (e) => {
  console.log(e.stack)
  process.exit(1)
})
