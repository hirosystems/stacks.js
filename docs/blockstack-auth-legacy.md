# Blockstack Auth JS

[![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack-auth-js.svg)](https://circleci.com/gh/blockstack/blockstack-auth-js/tree/master)
[![npm](https://img.shields.io/npm/l/blockstack-auth.svg)](https://www.npmjs.com/package/blockstack-auth)
[![npm](https://img.shields.io/npm/v/blockstack-auth.svg)](https://www.npmjs.com/package/blockstack-auth)
[![npm](https://img.shields.io/npm/dm/blockstack-auth.svg)](https://www.npmjs.com/package/blockstack-auth)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

Blockstack Auth is a Blockstack ID authentication library written in node.js that supports generating, decoding and verifying auth request and auth response tokens.

## Installation

```
$ npm install blockstack-auth
```

```js
var AuthRequest = require('blockstack-auth').AuthRequest,
    AuthResponse = require('blockstack-auth').AuthResponse,
    verifyAuthMessage = require('blockstack-auth').verifyAuthMessage,
    decodeToken = require('blockstack-auth').decodeToken
```

## Auth Requests

### Signing Requests

```js
> var privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
> var authRequest = new AuthRequest(privateKey)
> authRequest.setIssuer({ username: 'onename.id' })
> requestToken = authRequest.sign()
'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDI3ZDI4Zjk5NTFjZTQ2NTM4OTUxZTM2OTdjNjI1ODhhODdmMWYxZjI5NWRlNGExNGZkZDRjNzgwZmM1MmNmZTY5IiwiYmxvY2tjaGFpbmlkIjoib25lbmFtZSJ9LCJpc3N1ZWRBdCI6MTQ0NDI1ODkzNTI1MSwiY2hhbGxlbmdlIjoiMGI0MjcyMmItZTc4MS00MzRhLTgwNWQtYzA5YzQ3NmU4NmI5IiwicGVybWlzc2lvbnMiOlsiYmxvY2tjaGFpbmlkIl19.4sMvmUQ6q5DuAEXYaVIwVSe1nzd4KjfU3hwfoUztEAx9Gwr5XmS9-sBQZ2iS_x4uxzG2de1CHlw-14ZrB9ejww'
```

### Decoding Requests

```js
> decodedRequestToken = decodeToken(requestToken)
{ header: { typ: 'JWT', alg: 'ES256' },
  payload: {
    issuer: { publicKey: '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69', username: 'onename' },
    issuedAt: 1444258935251,
    permissions: [
      { action: 'sign', data: '0b42722b-e781-434a-805d-c09c476e86b9' },
      { action: 'disclose', scope: 'username' }
    ]
  },
  signature: '4sMvmUQ6q5DuAEXYaVIwVSe1nzd4KjfU3hwfoUztEAx9Gwr5XmS9-sBQZ2iS_x4uxzG2de1CHlw-14ZrB9ejww' }
```

### Verifying Requests

```js
verifyAuthMessage(authRequestToken, blockstackResolver, function(verified) {
    console.log(verified)
}, function(err) {
    console.log(err)
})
```

## Auth Responses

### Signing Responses

```js
> var privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f'
> var authResponse = new AuthResponse(privateKey)
> var username = 'ryan.id'
> var publicKeychain = 'xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ'
> var chainPath = 'bd62885ec3f0e3838043115f4ce25eedd22cc86711803fb0c19601eeef185e39'
> authResponse.setChallenge(decodedRequestToken.payload.challenge)
> authResponse.setIssuer(username, publicKeychain, chainPath)
> authResponseToken = authResponse.sign()
'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDNmZGQ1N2FkZWMzZDQzOGVhMjM3ZmU0NmIzM2VlMWUwMTZlZGE2YjU4NWMzZTI3ZWE2NjY4NmMyZWE1MzU4NDc5IiwiYmxvY2tjaGFpbmlkIjoicnlhbiIsInB1YmxpY0tleWNoYWluIjoieHB1YjY2MU15TXdBcVJiY0ZRVnJRcjRRNGtQamFQNEpqV2FmMzlmQlZLalBkSzZvR0JheUU0NkdBbUt6bzVVRFBRZExTTTlEdWZaaVA4ZWF1eTU2WE51SGljQnlTdlpwN0o1d3N5UVZwaTJheHpaIiwiY2hhaW5QYXRoIjoiYmQ2Mjg4NWVjM2YwZTM4MzgwNDMxMTVmNGNlMjVlZWRkMjJjYzg2NzExODAzZmIwYzE5NjAxZWVlZjE4NWUzOSJ9LCJpc3N1ZWRBdCI6MTQ0NDI1OTQyMjE5NiwiY2hhbGxlbmdlIjoiMGI0MjcyMmItZTc4MS00MzRhLTgwNWQtYzA5YzQ3NmU4NmI5In0.8TLQF_PI_egjP6WVlmf2rxPH-PMgrSDHGKE7d29qxU5KBRMlHppOIx69AoBdEEFr0HSFW0mDbM60W3kHC5jc-Q'
```

### Decoding Responses

```js
> decodeToken(authResponseToken)
{ header: { typ: 'JWT', alg: 'ES256' },
  payload: 
   { issuer: 
      { publicKey: '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479',
        username: 'ryan.id',
        publicKeychain: 'xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ',
        chainPath: 'bd62885ec3f0e3838043115f4ce25eedd22cc86711803fb0c19601eeef185e39' },
     issuedAt: 1444259422196,
     challenge: '0b42722b-e781-434a-805d-c09c476e86b9' },
  signature: '8TLQF_PI_egjP6WVlmf2rxPH-PMgrSDHGKE7d29qxU5KBRMlHppOIx69AoBdEEFr0HSFW0mDbM60W3kHC5jc-Q' }
```

### Verifying Responses

```js
verifyAuthMessage(authResponseToken, blockstackResolver, function(verified) {
    console.log(verified)
}, function(err) {
    console.log(err)
})
```

### Anonymous Responses

To sign an anonymous response token, simply omit all fields in the token preparation step except for the challenge:

```js
authResponse.prepare(challenge)
```