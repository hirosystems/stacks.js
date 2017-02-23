# Blockstack JS

[![npm](https://img.shields.io/npm/l/blockstack.svg)](https://www.npmjs.com/package/blockstack)
[![npm](https://img.shields.io/npm/v/blockstack.svg)](https://www.npmjs.com/package/blockstack)
[![npm](https://img.shields.io/npm/dm/blockstack.svg)](https://www.npmjs.com/package/blockstack)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

## Contents

* [Installation](#installation)
* [About](#about)
* [Profiles](#profiles)
* [Proofs](#proofs)
* [Wiki](#wiki)
* [Testing](#testing)

## Installation

```
$ npm install blockstack
```

## About

Blockstack JS is a library for identity and authentication.

The identity portion of this library can be used to:

1. transform a JSON profile into cryptographically-signed signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

The authentication portion of this library can be used to:

1. create an authentication request
1. create an authentication response

*Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var").*

## Profiles

Follow these steps to create and register a profile for a Blockchain ID:

1. Create a JSON profile object
2. Split up the profile into tokens, sign the tokens, and put them in a token file
3. Create a zone file that points to the web location of the profile token file

#### Create a profile

```es6
const profileOfNaval = {
  "@context": "http://schema.org/",
  "@type": "Person",
  "name": "Naval Ravikant",
  "description": "Co-founder of AngelList"
}
```

#### Sign a profile as a single token

```es6
import { ECPair } from 'bitcoinjs-lib'
import { signProfileToken, wrapProfileToken, Person } from 'blockstack'

const keyPair = new ECPair.makeRandom({ rng: getEntropy })
const privateKey = keyPair.d.toBuffer(32).toString('hex')
const publicKey = keyPair.getPublicKeyBuffer().toString('hex')

const person = new Person(profileOfNaval)
const token = person.toToken(privateKey)
const tokenFile = [wrapProfileToken(token)]
```

#### Verify an individual token

```js
import { verifyProfileToken } from 'blockstack'

try {
  const decodedToken = verifyProfileToken(tokenFile[0].token, publicKey)
} catch(e) {
  console.log(e)
}
```

#### Recover a profile from a token file

```js
const recoveredProfile = Person.fromToken(tokenFile, publicKey)
```

#### Validate profile schema

```js
const validationResults = Person.validateSchema(recoveredProfile)
```

#### Validate a proof

```es6
import { validateProofs } from 'blockstack'

const fullyQualifiedDomainName = "naval.id"
validateProofs(profile, fullyQualifiedDomainName).then((proofs) => {
  console.log(proofs)
})
```

## Testing

```
$ npm run test
```

#### Testing in a browser

*This test will only work with your browser's Cross-Origin Restrictions disabled.*

Run `npm run compile; npm run browserify` before opening the file `test.html`
in your browser.

## Wiki

#### Names

A blockchain ID = a name + a profile, registered on a blockchain.

Let's say you register the name 'alice' within the 'id' namespace, the default namespace for identities for people. In this case, your "fully qualified name" name would be expressed as `alice.id`.

#### Profiles

Profile schemas are taken from schema.org. The schema for a person record can be found at http://schema.org/Person. There are some fields that have yet to be included, like the "account", "key", "policy", "id", and "publicKey" fields. An updated schema definition will be published to a different location that superclasses the schema.org Person definition and adds these fields.

#### Profile Storage

Blockchain ID profiles are stored in two files: a token file and a zone file:

+ **token file** - contains signed tokens with profile data
+ **zone file** - describes where to find the token file

#### Lookups

An identity lookup is performed as follows:

1. lookup the name in Blockstack's name records and get back the data hash associated with the name
2. lookup the data hash in the Blockstack Atlas network and get back the zone file
3. scan the zone file for "zone origin" records and get the token file URL
4. issue a request to the token file URL and get back the token file
5. parse through the token file for tokens and verify that all the tokens have valid signatures and that they can be tied back to the public key associated with the user's name
6. grab all of the claims in the tokens and merge them into a single JSON object, which is the user's profile
