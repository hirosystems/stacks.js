# Blockstack Profiles

[![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack-profiles-js/master.svg)](https://circleci.com/gh/blockstack/blockstack-profiles-js/tree/master)
[![npm](https://img.shields.io/npm/l/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![npm](https://img.shields.io/npm/v/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![npm](https://img.shields.io/npm/dm/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

### Contents

* [Installation](#installation)
* [Importing](#importing)
* [Registration](#registration)
* [Profiles](#profiles)
* [Zone Files](#zone-files)
* [Wiki](#wiki)

A library for working with cryptographically-signed JSON profiles.

This library can be used to:

1. transform a JSON profile into signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

*Note: this document uses ES6 in its examples but it is compiled down to Javascript (ES5) and is perfectly compatible with it. If you're using the latter, just make a few adjustments to the examples below (e.g. use "let" instead of "var").*

### Installation

```
$ npm install blockstack-profiles
```

### Importing

#### ES6

```es6
import {
  signToken, wrapToken, signTokenRecords,
  verifyTokenRecord, getProfileFromTokens,
  Profile, Person, Organization, CreativeWork,
  prepareZoneFileForHostedFile
} from 'blockstack-profiles'
import { PrivateKeychain, PublicKeychain } from 'blockstack-keychain'
```

#### Node

```es6
var blockstackProfiles = require('blockstack-profiles')
var blockstackKeychain = require('blockstack-keychain')
```

### Registration

Follow these steps to create and register a profile for a Blockchain ID:

1. Create a JSON profile object
2. Split up the profile into tokens, sign the tokens, and put them in a token file
3. Create a zone file that points to the web location of the profile token file

### Profiles

#### Create a profile

```es6
let balloonDog = {
  "@context": "http://schema.org/",
  "@type": "CreativeWork",
  "name": "Balloon Dog",
  "creator": [
    {
      "@type": "Person",
      "@id": "therealjeffkoons.id",
      "name": "Jeff Koons"
    }
  ],
  "dateCreated": "1994-05-09T00:00:00-0400",
  "datePublished": "2015-12-10T14:44:26-0500"
}
```

#### Sign a profile as a single token

```es6
let privateKeychain = new PrivateKeychain(),
    privateKey = privateKeychain.privateKey('hex'),
    publicKey = privateKeychain.publicKeychain.publicKey('hex')
let token = signToken(balloonDog, privateKey, {publicKey: publicKey})
let tokenRecord = wrapToken(token)
console.log(token)
eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJAY29udGV4dCI6Imh0dHA6Ly9zY2hlbWEub3JnLyIsIkB0eXBlIjoiQ3JlYXRpdmVXb3JrIiwibmFtZSI6IkJhbGxvb24gRG9nIiwiY3JlYXRvciI6W3siQHR5cGUiOiJQZXJzb24iLCJAaWQiOiJ0aGVyZWFsamVmZmtvb25zLmlkIiwibmFtZSI6IkplZmYgS29vbnMifV0sImRhdGVDcmVhdGVkIjoiMTk5NC0wNS0wOVQwMDowMDowMC0wNDAwIiwiZGF0ZVB1Ymxpc2hlZCI6IjIwMTUtMTItMTBUMTQ6NDQ6MjYtMDUwMCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzMTc1MTFlOWVhY2Y0MmZlOGY3MTdmNzU3ODc2YzU1YmQ1ZDRjODgxOGViYWMxNzdiMzUwZmEyZDMzMzAwMTA2NiJ9LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDMxNzUxMWU5ZWFjZjQyZmU4ZjcxN2Y3NTc4NzZjNTViZDVkNGM4ODE4ZWJhYzE3N2IzNTBmYTJkMzMzMDAxMDY2In0sImlzc3VlZEF0IjoiMjAxNi0wNC0xOFQyMzo0NTo1Mi40MTFaIiwiZXhwaXJlc0F0IjoiMjAxNy0wNC0xOFQyMzo0NTo1Mi40MTFaIn0.4M-XodG4PaNm1NovKKo3gZVUMwG6aN7W9sVESqdZ4I9UaTB30jEuvqKWyD4aPcckw6SEEbZ1cBwgW9qXNXipzg
console.log(tokenRecord)
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJAY29udGV4dCI6Imh0dHA6Ly9zY2hlbWEub3JnLyIsIkB0eXBlIjoiQ3JlYXRpdmVXb3JrIiwibmFtZSI6IkJhbGxvb24gRG9nIiwiY3JlYXRvciI6W3siQHR5cGUiOiJQZXJzb24iLCJAaWQiOiJ0aGVyZWFsamVmZmtvb25zLmlkIiwibmFtZSI6IkplZmYgS29vbnMifV0sImRhdGVDcmVhdGVkIjoiMTk5NC0wNS0wOVQwMDowMDowMC0wNDAwIiwiZGF0ZVB1Ymxpc2hlZCI6IjIwMTUtMTItMTBUMTQ6NDQ6MjYtMDUwMCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzMTc1MTFlOWVhY2Y0MmZlOGY3MTdmNzU3ODc2YzU1YmQ1ZDRjODgxOGViYWMxNzdiMzUwZmEyZDMzMzAwMTA2NiJ9LCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDMxNzUxMWU5ZWFjZjQyZmU4ZjcxN2Y3NTc4NzZjNTViZDVkNGM4ODE4ZWJhYzE3N2IzNTBmYTJkMzMzMDAxMDY2In0sImlzc3VlZEF0IjoiMjAxNi0wNC0xOFQyMzo0NTo1Mi40MTFaIiwiZXhwaXJlc0F0IjoiMjAxNy0wNC0xOFQyMzo0NTo1Mi40MTFaIn0.4M-XodG4PaNm1NovKKo3gZVUMwG6aN7W9sVESqdZ4I9UaTB30jEuvqKWyD4aPcckw6SEEbZ1cBwgW9qXNXipzg",
  "data": {
    "header": {
      "typ": "JWT",
      "alg": "ES256K"
    },
    "payload": {
      "claim": {
        "@context": "http://schema.org/",
        "@type": "CreativeWork",
        "name": "Balloon Dog",
        "creator": [
          {
            "@type": "Person",
            "@id": "therealjeffkoons.id",
            "name": "Jeff Koons"
          }
        ],
        "dateCreated": "1994-05-09T00:00:00-0400",
        "datePublished": "2015-12-10T14:44:26-0500"
      },
      "subject": {
        "publicKey": "0317511e9eacf42fe8f717f757876c55bd5d4c8818ebac177b350fa2d333001066"
      },
      "issuer": {
        "publicKey": "0317511e9eacf42fe8f717f757876c55bd5d4c8818ebac177b350fa2d333001066"
      },
      "issuedAt": "2016-04-18T23:45:52.411Z",
      "expiresAt": "2017-04-18T23:45:52.411Z"
    },
    "signature": "4M-XodG4PaNm1NovKKo3gZVUMwG6aN7W9sVESqdZ4I9UaTB30jEuvqKWyD4aPcckw6SEEbZ1cBwgW9qXNXipzg"
  },
  "encrypted": false,
  "parentPublicKey": "02b511f1267a77f5814b2c07f03f1f112438d4be6f553dd4b877b2832874b4e706",
  "derivationEntropy": "1f8eaa7a916f05218cfc6904a3dab1a1ccd3ab69fbdd9d96a24db8c7445d118c"
}
```

#### Verify an individual token

```js
try {
  let decodedToken = verifyTokenRecord(tokenRecords[0], publicKeychain)
} catch(e) {
  console.log(e)
}
```

#### Transform a profile to multiple signed tokens

```es6
let privateKeychain = new PrivateKeychain()
let tokenRecords = signTokenRecords([balloonDog], privateKeychain)
console.log(tokenRecords)
[
  {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJAY29udGV4dCI6Imh0dHA6Ly9zY2hlbWEub3JnLyIsIkB0eXBlIjoiQ3JlYXRpdmVXb3JrIiwibmFtZSI6IkJhbGxvb24gRG9nIiwiY3JlYXRvciI6W3siQHR5cGUiOiJQZXJzb24iLCJAaWQiOiJ0aGVyZWFsamVmZmtvb25zLmlkIiwibmFtZSI6IkplZmYgS29vbnMifV0sImRhdGVDcmVhdGVkIjoiMTk5NC0wNS0wOVQwMDowMDowMC0wNDAwIiwiZGF0ZVB1Ymxpc2hlZCI6IjIwMTUtMTItMTBUMTQ6NDQ6MjYtMDUwMCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzYTU5ZGJmZDk2MTJlNDA4ODgxOGM5MGUxOWFmY2Y4ZDE3OTNiMzhhNWMwNDBjMzhkN2QwN2JiN2QzOWQ4NmQ3MiJ9LCJpc3N1ZWRBdCI6IjIwMTYtMDMtMTBUMTc6MDE6MzIuODc5WiIsImV4cGlyZXNBdCI6IjIwMTctMDMtMTBUMTc6MDE6MzIuODc5WiJ9.vEUJzl713FApgDNYzbUue5SDOdeElxEaAnMbmT-A6ihfrnzhOd5WvzlGJwTiz1LbeTruhQgbh_XyCJ6aLxfu6A",
    "data": {
      "header": {
        "typ": "JWT",
        "alg": "ES256K"
      },
      "payload": {
        "claim": {
          "@context": "http://schema.org/",
          "@type": "CreativeWork",
          "name": "Balloon Dog",
          "creator": [
            {
              "@type": "Person",
              "@id": "therealjeffkoons.id",
              "name": "Jeff Koons"
            }
          ],
          "dateCreated": "1994-05-09T00:00:00-0400",
          "datePublished": "2015-12-10T14:44:26-0500"
        },
        "subject": {
          "publicKey": "03a59dbfd9612e4088818c90e19afcf8d1793b38a5c040c38d7d07bb7d39d86d72"
        },
        "issuedAt": "2016-03-10T17:01:32.879Z",
        "expiresAt": "2017-03-10T17:01:32.879Z"
      },
      "signature": "vEUJzl713FApgDNYzbUue5SDOdeElxEaAnMbmT-A6ihfrnzhOd5WvzlGJwTiz1LbeTruhQgbh_XyCJ6aLxfu6A"
    },
    "publicKey": "03a59dbfd9612e4088818c90e19afcf8d1793b38a5c040c38d7d07bb7d39d86d72",
    "encrypted": false,
    "parentPublicKey": "03be573c8dbdd74bbc457f530c4f5898f7147f105af57c1aee20127f981697b884",
    "derivationEntropy": "35d0d4e73780d7e47b404a961c9005f415db76ae88c1bcd4bdcd742d68670f26"
  }
]
```

#### Recover a profile from tokens

```js
let publicKeychain = privateKeychain.publicKeychain()
let recoveredProfile = getProfileFromTokens(tokenRecords, publicKeychain)
console.log(recoveredProfile)
{ '@context': 'http://schema.org/',
  '@type': 'CreativeWork',
  name: 'Balloon Dog',
  creator: 
   [ { '@type': 'Person',
       name: 'Jeff Koons',
       id: 'therealjeffkoons.id' } ],
  dateCreated: '1994-05-09T00:00:00-0400',
  datePublished: '2015-12-10T14:44:26-0500' }
```

#### Validate profile schema

```js
> var validationResults = Person.validateSchema(recoveredProfile)
> console.log(validationResults.valid)
true
```

### Wiki

#### Names

A blockchain ID = a name + a profile, registered on a blockchain.

Let's say you register the name 'alice' within the 'id' namespace, the default namespace for identities for people. In this case, your "fully qualified name" name would be expressed as `alice.id`.

#### Profiles

Profile schema is taken from schema.org. The schema for a person record can be found at http://schema.org/Person. There are some fields that have yet to be included, like the "account", "key", "policy", "id", and "publicKey" fields. An updated schema definition will be published to a different location that superclasses the schema.org Person definition and adds these fields.

#### Profile Storage

Blockchain ID profiles are stored in two files: a token file and a zone file:

+ **token file** - contains signed tokens with profile data
+ **zone file** - describes where to find the token file

#### Lookups

An identity lookup is performed as follows:

1. lookup the name in blockstore's name records and get back the data hash associated with the name
2. lookup the data hash in the blockstore DHT and get back the zone file
3. scan the zone file for "zone origin" records and get the URL found in the "data" field - the token file URL
4. issue a request to the token file URL and get back the token file
5. parse through the token file for tokens and verify that all the tokens have valid signatures and that they can be tied back to the user's name (by using the public keychain)
6. grab all of the claims in the tokens and merge them into a single JSON object, which is the user's profile