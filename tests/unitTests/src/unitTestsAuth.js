'use strict'

// import test from 'tape'
import test from 'tape-promise/tape'
import { decodeToken } from 'jsontokens'
import FetchMock from 'fetch-mock'

import {
  makeAuthRequest,
  makeAuthResponse,
  verifyAuthRequest,
  verifyAuthResponse,
  publicKeyToAddress,
  makeDIDFromAddress,
  isExpirationDateValid,
  isIssuanceDateValid,
  doSignaturesMatchPublicKeys,
  doPublicKeysMatchIssuer,
  doPublicKeysMatchUsername,
  isManifestUriValid,
  isRedirectUriValid,
  verifyAuthRequestAndLoadManifest
} from '../../../lib'
import blockstack from '../../../lib'

import { sampleManifests, sampleProfiles, sampleNameRecords } from './sampleData'

export function runAuthTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'
  const nameLookupURL = 'https://explorer-api.appartisan.com/get_name_blockchain_record/'

  test('makeAuthRequest && verifyAuthRequest', (t) => {
    t.plan(15)

    global.window = {
      location: {
        origin: 'http://localhost:3000',
        hostname: 'localhost',
        host: 'localhost:3000',
        href: 'http://localhost:3000/signin'
      }
    }
    const authRequest = makeAuthRequest(privateKey)
    t.ok(authRequest, 'auth request should have been created')
    console.log(authRequest)

    const decodedToken = decodeToken(authRequest)
    t.ok(decodedToken, 'auth request token should have been decoded')
    console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    const origin = 'http://localhost:3000'
    t.equal(decodedToken.payload.iss, referenceDID, 'auth request issuer should include the public key')
    t.equal(decodedToken.payload.domain_name, origin, 'auth request domain_name should be origin')
    t.equal(decodedToken.payload.redirect_uri, 'http://localhost:3000/', 'auth request redirects to correct uri')
    t.equal(decodedToken.payload.manifest_uri, 'http://localhost:3000/manifest.json', 'auth request manifest is correct uri')

    t.equal(JSON.stringify(decodedToken.payload.scopes), '["store_write"]', 'auth request scopes should be store_write')

    verifyAuthRequest(authRequest)
      .then((verified) => {
        t.true(verified, 'auth request should be verified')
      })

    t.true(isExpirationDateValid(authRequest), 'Expiration date should be valid')
    t.true(isIssuanceDateValid(authRequest), 'Issuance date should be valid')
    t.true(doSignaturesMatchPublicKeys(authRequest), 'Signatures should match the public keys')
    t.true(doPublicKeysMatchIssuer(authRequest), 'Public keys should match the issuer')
    t.true(isManifestUriValid(authRequest), 'Manifest URI should be on the app origin')
    t.true(isRedirectUriValid(authRequest), 'Redirect URL should be to app origin')



    const manifiestUrl = 'http://localhost:3000/manifest.json'
    const manifest = {
      "name": "App",
      "start_url": "http://localhost:3000/",
      "description": "A simple todo app build on blockstack",
      "icons": [{
        "src": "http://localhost:3000/logo.png",
        "sizes": "400x400",
        "type": "image/png"
      }]
    }
    const manifestString = JSON.stringify(manifest)
    FetchMock.get(manifiestUrl, manifestString)

    verifyAuthRequestAndLoadManifest(authRequest)
      .then((appManifest) => {
        console.log(appManifest)
        t.equal(appManifest.name, 'App', 'should fetch manifest for valid auth request')
      })
  })

  test('invalid auth request - signature not verified', (t) => {
    t.plan(3)

    const authRequest = makeAuthRequest(privateKey, 'http://localhost:3000')
    const invalidAuthRequest = authRequest.substring(0, authRequest.length - 1)

    t.equal(doSignaturesMatchPublicKeys(invalidAuthRequest), false,
          'Signatures should not match the public keys')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })

    verifyAuthRequestAndLoadManifest(invalidAuthRequest)
      .then(() => {
        // no op
      },
      () => {
        t.pass('invalid auth request rejected')
      })
  })

  test('invalid auth request - invalid redirect uri', (t) => {
    t.plan(3)

    const invalidAuthRequest = makeAuthRequest(privateKey, 'https://example.com')

    t.equal(isRedirectUriValid(invalidAuthRequest), false,
          'Redirect URI should be invalid since it does not match origin')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })

    verifyAuthRequestAndLoadManifest(invalidAuthRequest)
      .then(() => {
        // no op
      },
      () => {
        t.pass('invalid auth request rejected')
      })
  })

  test('invalid auth request - invalid manifest uri', (t) => {
    t.plan(2)

    const invalidAuthRequest = makeAuthRequest(privateKey, 'http://localhost:3000', 'https://example.com/manifest.json')

    t.equal(isManifestUriValid(invalidAuthRequest), false,
          'Manifest URI should be invalid since it does not match origin')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })
  })

  test('makeAuthResponse && verifyAuthResponse', (t) => {
    t.plan(11)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan)
    t.ok(authResponse, 'auth response should have been created')

    const decodedToken = decodeToken(authResponse)
    t.ok(decodedToken, 'auth response should have been decoded')
    // console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    t.equal(decodedToken.payload.iss, referenceDID, 'auth response issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.profile), JSON.stringify(sampleProfiles.ryan), 'auth response profile should equal the reference value')

    t.equal(decodedToken.payload.username, null, 'auth response username should be null')

    // const verified = verifyAuthResponse(authResponse)
    // t.equal(verified, true, 'auth response should be verified')

    verifyAuthResponse(authResponse, nameLookupURL)
      .then(verifiedResult => {
        t.true(verifiedResult, 'auth response should be verified')
      })

    t.true(isExpirationDateValid(authResponse), 'Expiration date should be valid')
    t.true(isIssuanceDateValid(authResponse), 'Issuance date should be valid')
    t.true(doSignaturesMatchPublicKeys(authResponse), 'Signatures should match the public keys')
    t.true(doPublicKeysMatchIssuer(authResponse), 'Public keys should match the issuer')

    doPublicKeysMatchUsername(authResponse, nameLookupURL)
      .then(verifiedResult => {
        t.true(verifiedResult, 'Public keys should match the username')
      })
  })

  test('auth response with username', (t) => {
    t.plan(2)

    const url = `${nameLookupURL}ryan.id`
    // console.log(`URL: ${url}`)

    FetchMock.get(url, sampleNameRecords.ryan)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id')
    // console.log(decodeToken(authResponse))

    doPublicKeysMatchUsername(authResponse, nameLookupURL)
      .then(verified => {
        t.true(verified, 'Public keys should match the username')
      })

    verifyAuthResponse(authResponse, nameLookupURL)
      .then(verifiedResult => {
        t.true(verifiedResult, 'auth response should be verified')
      })
  })
}

// const sampleToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjE0NDA3MTM0MTQuMTkiLCJjaGFsbGVuZ2UiOiIxZDc4NTBkNy01YmNmLTQ3ZDAtYTgxYy1jMDA4NTc5NzY1NDQiLCJwZXJtaXNzaW9ucyI6WyJibG9ja2NoYWluaWQiXSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAzODI3YjZhMzRjZWJlZTZkYjEwZDEzNzg3ODQ2ZGVlYWMxMDIzYWNiODNhN2I4NjZlMTkyZmEzNmI5MTkwNjNlNCIsImRvbWFpbiI6Im9uZW5hbWUuY29tIn19.96Q_O_4DX8uPy1enosEwS2sIcyVelWhxvfj2F8rOvHldhqt9YRYilauepb95DVnmpqpCXxJb7jurT8auNCbptw'
// const sampleTokenPayload = {"issuedAt": "1440713414.19", "challenge": "1d7850d7-5bcf-47d0-a81c-c00857976544", "permissions": ["blockchainid"], "issuer": {"publicKey": "03827b6a34cebee6db10d13787846deeac1023acb83a7b866e192fa36b919063e4", "domain": "onename.com"}}
