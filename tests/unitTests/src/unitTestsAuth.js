'use strict'

import test from 'tape'
import { decodeToken } from 'jsontokens'

import {
  makeAuthRequest,
  makeAuthResponse,
  verifyAuthRequest,
  verifyAuthResponse,
  publicKeyToAddress,
  makeDIDFromAddress
} from '../../../lib'

import { sampleManifests, sampleProfiles } from './sampleData'

export function runAuthTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

  test('makeAuthRequest && verifyAuthRequest', (t) => {
    t.plan(5)

    const authRequest = makeAuthRequest(privateKey, sampleManifests.helloBlockstack)
    t.ok(authRequest, 'auth request should have been created')

    const decodedToken = decodeToken(authRequest)
    t.ok(decodedToken, 'auth request token should have been decoded')
    console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    t.equal(decodedToken.payload.iss, referenceDID, 'auth request issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.scopes), "[]", 'auth request scopes should be an empty list')

    const verified = verifyAuthRequest(authRequest)
    t.equal(verified, true, 'auth request should be verified')
  })

  test('makeAuthResponse && verifyAuthResponse', (t) => {
    t.plan(6)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan)
    t.ok(authResponse, 'auth response should have been created')

    const decodedToken = decodeToken(authResponse)
    t.ok(decodedToken, 'auth response should have been decoded')
    console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    t.equal(decodedToken.payload.iss, referenceDID, 'auth response issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.profile), JSON.stringify(sampleProfiles.ryan), 'auth response profile should equal the reference value')

    t.equal(decodedToken.payload.username, null, 'auth response username should be null')

    const verified = verifyAuthResponse(authResponse)
    t.equal(verified, true, 'auth request should be verified')
  })
}

//const sampleToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjE0NDA3MTM0MTQuMTkiLCJjaGFsbGVuZ2UiOiIxZDc4NTBkNy01YmNmLTQ3ZDAtYTgxYy1jMDA4NTc5NzY1NDQiLCJwZXJtaXNzaW9ucyI6WyJibG9ja2NoYWluaWQiXSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAzODI3YjZhMzRjZWJlZTZkYjEwZDEzNzg3ODQ2ZGVlYWMxMDIzYWNiODNhN2I4NjZlMTkyZmEzNmI5MTkwNjNlNCIsImRvbWFpbiI6Im9uZW5hbWUuY29tIn19.96Q_O_4DX8uPy1enosEwS2sIcyVelWhxvfj2F8rOvHldhqt9YRYilauepb95DVnmpqpCXxJb7jurT8auNCbptw'
//const sampleTokenPayload = {"issuedAt": "1440713414.19", "challenge": "1d7850d7-5bcf-47d0-a81c-c00857976544", "permissions": ["blockchainid"], "issuer": {"publicKey": "03827b6a34cebee6db10d13787846deeac1023acb83a7b866e192fa36b919063e4", "domain": "onename.com"}}
