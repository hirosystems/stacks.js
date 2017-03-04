'use strict'

import test from 'tape'
import { decodeToken } from 'jsontokens'

import {
  makeAuthRequest, makeAuthResponse, makeDIDFromPublicKey
} from '../index'

export function runAuthTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'
  const appManifest = {
    name: "Hello, Blockstack",
    short_name: "Hello, Blockstack",
    start_url: "https://helloblockstack.com",
    display: "standalone",
    background_color: "#fff",
    description: "A simple app demonstrating how to log in with Blockstack.",
    icons: [
      {
        src: "https://raw.githubusercontent.com/blockstack/blockstack-portal/master/app/images/app-hello-blockstack.png",
        sizes: "192x19x",
        type: "image/png"
      }
    ]
  }
  const profile = {
    "@type": "Person",
    name: "Ryan Shea",
    description: "Co-founder of Blockstack Inc."
  }

  //const sampleToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjE0NDA3MTM0MTQuMTkiLCJjaGFsbGVuZ2UiOiIxZDc4NTBkNy01YmNmLTQ3ZDAtYTgxYy1jMDA4NTc5NzY1NDQiLCJwZXJtaXNzaW9ucyI6WyJibG9ja2NoYWluaWQiXSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAzODI3YjZhMzRjZWJlZTZkYjEwZDEzNzg3ODQ2ZGVlYWMxMDIzYWNiODNhN2I4NjZlMTkyZmEzNmI5MTkwNjNlNCIsImRvbWFpbiI6Im9uZW5hbWUuY29tIn19.96Q_O_4DX8uPy1enosEwS2sIcyVelWhxvfj2F8rOvHldhqt9YRYilauepb95DVnmpqpCXxJb7jurT8auNCbptw'
  //const sampleTokenPayload = {"issuedAt": "1440713414.19", "challenge": "1d7850d7-5bcf-47d0-a81c-c00857976544", "permissions": ["blockchainid"], "issuer": {"publicKey": "03827b6a34cebee6db10d13787846deeac1023acb83a7b866e192fa36b919063e4", "domain": "onename.com"}}

  test('makeAuthRequest', (t) => {
    t.plan(4)

    const authRequest = makeAuthRequest(privateKey, appManifest)
    t.ok(authRequest, 'auth request should have been created')

    const decodedToken = decodeToken(authRequest)
    t.ok(decodedToken, 'auth request token should have been decoded')

    const referenceDID = makeDIDFromPublicKey(publicKey)
    t.equal(decodedToken.payload.iss, referenceDID, 'auth request issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.scopes), "[]", 'auth request scopes should be an empty list')
  })

  test('makeAuthResponse', (t) => {
    t.plan(5)

    const authResponse = makeAuthResponse(privateKey, profile)
    t.ok(authResponse, 'auth response should have been created')

    const decodedToken = decodeToken(authResponse)
    t.ok(decodedToken, 'auth response should have been decoded')

    const referenceDID = makeDIDFromPublicKey(publicKey)
    t.equal(decodedToken.payload.iss, referenceDID, 'auth response issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.profile), JSON.stringify(profile), 'auth response profile should equal the reference value')

    t.equal(decodedToken.payload.username, null, 'auth response username should be null')
  })
}