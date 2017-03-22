# blockstack.js [![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack.js/master.svg)](https://circleci.com/gh/blockstack/blockstack.js/tree/master) [![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack) [![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

Note: If you're looking for the Blockstack CLI repo it was merged with [Blockstack Core](https://github.com/blockstack/blockstack-core).

* [Installation](#installation)
* [About](#about)
* [Auth](#auth)
* [Profiles](#profiles)
* [Wiki](#wiki)
* [Testing](#testing)

## Installation

```
$ npm install blockstack
```

## About

Blockstack JS is a library for profiles/identity and authentication.

The authentication portion of this library can be used to:

1. create an authentication request
1. create an authentication response

The profiles/identity portion of this library can be used to:

1. transform a JSON profile into cryptographically-signed signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

*Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var").*

## Auth

### Request a user to sign in

```es6
import { requestSignIn } from 'blockstack'

var appManifest = {
  name: "Hello, Blockstack",
  start_url: "https://helloblockstack.com",
  description: "A simple demo of blockstack auth",
  icons: [{
    "src": "https://raw.githubusercontent.com/blockstack/blockstack-portal/master/app/images/app-hello-blockstack.png",
    "sizes": "192x192",
    "type": "image/png"
  }]
}

$('#login-button').click(function() {
    requestSignIn(null, appManifest) // The user will be redirected to their identity provider
})
```

### Sign a user in

```es6
import { signUserIn } from 'blockstack'

signUserIn((session) => {
    // Redirect the user to the home page
})

```

### Create a raw auth request

```es6
import { makeAuthRequest, makeECPrivateKey } from 'blockstack'

const privateKey = makeECPrivateKey()

const appManifest = { name: "Hello, Blockstack", start_url: "https://helloblockstack.com" }
const authRequest = makeAuthRequest(privateKey, appManifest)
```

### Verify an auth request

```es6
import { verifyAuthRequest } from 'blockstack'

const verified = verifyAuthRequest(authRequest)
```

### Create an auth response

```es6
import { makeAuthResponse, makeECPrivateKey } from 'blockstack'
const privateKey = makeECPrivateKey()

const authData = { profile: { name: 'Naval Ravikant' }, username: 'naval.id' }
const authResponse = makeAuthResponse(privateKey, authData)
```

### Verify an auth response

```
import { verifyAuthResponse } from 'blockstack'

const verified = verifyAuthResponse(authResponse)
```

## Profiles

Follow these steps to create and register a profile for a Blockchain ID:

1. Create a JSON profile object
2. Split up the profile into tokens, sign the tokens, and put them in a token file
3. Create a zone file that points to the web location of the profile token file

### Create a profile

```es6
const profileOfNaval = {
  "@context": "http://schema.org/",
  "@type": "Person",
  "name": "Naval Ravikant",
  "description": "Co-founder of AngelList"
}
```

### Sign a profile as a single token

```es6
import { makeECPrivateKey, wrapProfileToken, Person } from 'blockstack'

const privateKey = makeECPrivateKey()

const person = new Person(profileOfNaval)
const token = person.toToken(privateKey)
const tokenFile = [wrapProfileToken(token)]
```

### Verify an individual token

```js
import { verifyProfileToken } from 'blockstack'

try {
  const decodedToken = verifyProfileToken(tokenFile[0].token, publicKey)
} catch(e) {
  console.log(e)
}
```

### Recover a profile from a token file

```js
const recoveredProfile = Person.fromToken(tokenFile, publicKey)
```

### Validate profile schema

```js
const validationResults = Person.validateSchema(recoveredProfile)
```

### Validate a proof

```es6
import { validateProofs } from 'blockstack'

const domainName = "naval.id"
validateProofs(profile, domainName).then((proofs) => {
  console.log(proofs)
})
```

## Testing

```
$ npm run test
```

### Testing in a browser

*This test will only work with your browser's Cross-Origin Restrictions disabled.*

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.
