# Blockchain Auth

[![npm](https://img.shields.io/npm/v/blockchain-auth.svg)](https://www.npmjs.com/package/blockchain-auth)
[![npm](https://img.shields.io/npm/dm/blockchain-auth.svg)](https://www.npmjs.com/package/blockchain-auth)
[![npm](https://img.shields.io/npm/l/blockchain-auth.svg)](https://www.npmjs.com/package/blockchain-auth)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

A Blockchain ID authentication library written in node.js that supports generating, decoding and verifying auth request and auth response tokens.

[![Read the Wiki](https://raw.githubusercontent.com/blockstack/blockchain-id/master/images/read-the-wiki.png)](https://github.com/blockstack/blockchain-id/wiki/Blockchain-ID-Auth)

## Getting Started

```
$ npm install blockchain-auth
```

```js
var blockchainAuth = require('blockchain-auth'),
    AuthRequest = blockchainAuth.AuthRequest,
    AuthResponse = blockchainAuth.AuthResponse
```

## Auth Requests

### Request Format

```json
{
    "header": {
        "typ": "JWT",
        "alg": "ES256"
    },
    "payload": {
        "issuedAt":"1440624435.28",
        "challenge":"8befe9e5-db3a-408a-aaae-c41c1c8eee55",
        "permissions":["blockchainid"],
        "issuer": {
            "publicKey":"0231e4873b5569c5811b4849cf1797f2bff3dab358b07416aa7a9af638f7182ca3",
            "domain":"onename.com"
        }
    },
    "signature": "MEUCIQDzUaSrgTR_tTpNSVcitKYvYWd3bc3uylMe3xCfo-QclQIgDLN1hgXSyqiEk0AGQ21XB2wzuqrotTmE_yN3pn4f_38"
}
```

### Signing Requests

```js
var authRequest = new AuthRequest(privateKeyHex, publicKeyHex, issuingDomain, permissions),
    authRequestToken = authRequest.token(),
    decodedAuthRequestToken = authRequest.decode()
```

### Verifying Requests

```js
AuthRequest.verify(authRequestToken, resolver, function(err, verified) {
    console.log(verified)
})
```

## Auth Responses

### Response Format

```json
{
    "header": {
        "typ": "JWT",
        "alg": "ES256"
    },
    "payload": {
        "issuedAt": "1440713414.85",
        "challenge": "7cd9ed5e-bb0e-49ea-a323-f28bde3a0549",
        "issuer": {
            "publicKey": "03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479",
            "blockchainid": "ryan",
            "publicKeychain": "xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ",
            "chainPath": "bd62885ec3f0e3838043115f4ce25eedd22cc86711803fb0c19601eeef185e39"
        }
    },
    "signature": "MEUCIQDzUaSrgTR_tTpNSVcitKYvYWd3bc3uylMe3xCfo-QclQIgDLN1hgXSyqiEk0AGQ21XB2wzuqrotTmE_yN3pn4f_38"
}
```

### Signing Responses

```js
var authResponse = new AuthResponse(privateKeyHex, publicKeyHex, challenge, blockchainid, publicKeychain, chainPath),
    authResponseToken = authResponse.token(),
    decodedAuthResponseToken = authResponse.decode()
```

### Signing Anonymous Responses

```js
var authResponse = new AuthResponse(privateKeyHex, publicKeyHex, challenge)
```

### Verifying Responses

```js
AuthResponse.verify(authResponseToken, resolver, function(err, verified) {
})
```
