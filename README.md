# Blockstack Profiles

[![CircleCI](https://img.shields.io/circleci/project/blockstack/blockstack-profiles.svg)](https://circleci.com/gh/blockstack/blockstack-profiles)
[![npm](https://img.shields.io/npm/l/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![npm](https://img.shields.io/npm/v/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![npm](https://img.shields.io/npm/dm/blockstack-profiles.svg)](https://www.npmjs.com/package/blockstack-profiles)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

## Contents

* [Getting Started](#getting-started)
    * [Installation](#installation)
    * [Importing](#importing)
* [Registration](#registration)
* [Profiles](#profiles)
* [Zonefiles](#zonefiles)
* [Wiki](#wiki)

A library for working with cryptographically-signed JSON profiles.

This library can be used to:

1. transform a JSON profile into signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

*Note: this document uses ES6 in its examples but it is compiled down to and is perfectly compatible with use of Javascript (ES5). If you're using the latter, you'll just have to make a few adjustments to the examples below (e.g. use "let" instead of "var").*

## Getting Started

### Installation

```
$ npm install blockstack-profiles
```

### Importing

#### ES6

```es6
import { signRecords, getProfileFromTokens, Person } from 'blockstack-profiles'
import { PrivateKeychain, PublicKeychain } from 'elliptic-keychain'
```

#### Node

```es6
var signRecords = require('blockstack-profiles').signRecords,
    getProfileFromTokens = require('blockstack-profiles').getProfileFromTokens

var PrivateKeychain = require('elliptic-keychain').PrivateKeychain,
    PublicKeychain = require('elliptic-keychain').PublicKeychain
```

## Registration

Follow these steps to create and register a profile for a Blockchain ID:

1. Create a JSON profile object
2. Split up the profile into tokens, sign the tokens, and put them in a token file
3. Create a zone file that points to the web location of the profile token file

## Profiles

### Create a profile

```es6
var balloonDog = {
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

### Transform the profile to signed tokens

```js
> var privateKeychain = new PrivateKeychain()
> var tokenRecords = signRecords([balloonDog], privateKeychain)
> console.log(tokenRecords)
[
  {
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJAY29udGV4dCI6Imh0dHA6Ly9zY2hlbWEub3JnLyIsIkB0eXBlIjoiQ3JlYXRpdmVXb3JrIiwibmFtZSI6IkJhbGxvb24gRG9nIiwiY3JlYXRvciI6W3siQHR5cGUiOiJQZXJzb24iLCJAaWQiOiJ0aGVyZWFsamVmZmtvb25zLmlkIiwibmFtZSI6IkplZmYgS29vbnMifV0sImRhdGVDcmVhdGVkIjoiMTk5NC0wNS0wOVQwMDowMDowMC0wNDAwIiwiZGF0ZVB1Ymxpc2hlZCI6IjIwMTUtMTItMTBUMTQ6NDQ6MjYtMDUwMCJ9LCJzdWJqZWN0Ijp7InB1YmxpY0tleSI6IjAzMTk0YjczMTY5OTIzOTc5NmFiZDNkNjQyZTM2MDcyMDhiYjQ0ZmNhYTM5Y2Q2NDBjNGM1MDM2MGIzNmFhNWZkOSJ9LCJpc3N1ZWRBdCI6IjIwMTctMDMtMTBUMTY6NTY6MTIuNzk5WiIsImV4cGlyZXNBdCI6IjIwMTctMDMtMTBUMTY6NTY6MTIuNzk5WiJ9.pBxK6gIzpsjWhi9L1nhSeNKMbOPIQ89gEfn4SlDapsWXAcmfWsFSPzpe5rmh43IedlkwAzzt0WOkmMwjjjpplw",
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
          "publicKey": "03194b731699239796abd3d642e3607208bb44fcaa39cd640c4c50360b36aa5fd9"
        },
        "issuedAt": "2017-03-10T16:56:12.799Z",
        "expiresAt": "2017-03-10T16:56:12.799Z"
      },
      "signature": "pBxK6gIzpsjWhi9L1nhSeNKMbOPIQ89gEfn4SlDapsWXAcmfWsFSPzpe5rmh43IedlkwAzzt0WOkmMwjjjpplw"
    },
    "publicKey": "03194b731699239796abd3d642e3607208bb44fcaa39cd640c4c50360b36aa5fd9",
    "encrypted": false,
    "parentPublicKey": "031d9304790e4adca7fac304bddbcb1419db9a6b6b682c2d4e7631d7e238cceffd",
    "derivationEntropy": "5ee70faa32c3afd79c4276dbe2e1bc33582fbfc6b3e0514eefa547dcea535ed8"
  }
]
```

### Recover the profile from the tokens

```js
> var publicKeychain = privateKeychain.publicKeychain()
> var recoveredProfile = getProfileFromTokens(tokenRecords, publicKeychain)
> console.log(recoveredProfile)
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

### Validate the profile

```js
> var validationResults = Person.validate(recoveredProfile)
> console.log(validationResults.valid)
true
```

## Zone Files

### Create a zone file object

```js
var zoneFileData = {
  "$origin": "MYDOMAIN.COM.",
  "$ttl": 3600,
  "a": [
    { "name": "@", "ip": "127.0.0.1" },
    { "name": "www", "ip": "127.0.0.1" }
  ]
}

var zoneFile = new ZoneFile(zoneFileData)
```

### Output the zone file as a string

```js
var zoneFileString = zoneFile.toString()
```

### Output the zone file to JSON

```js
var zoneFileJson = zoneFile.toJSON()
```

## Wiki

### Names

A blockchain ID = a name + a profile, registered on a blockchain.

Let's say you register the name 'alice' within the 'id' namespace, the default namespace for name. Then your name would be expressed as `alice.id`.

### Profiles

Profile schema is taken from schema.org. The schema for a person record can be found at http://schema.org/Person. There are some fields that have yet to be included, like the "account", "key", "policy", "id", and "publicKey" fields. An updated schema definition will be published to a different location that superclasses the schema.org Person definition and adds these fields.

### Profile Storage

Blockchain ID profiles are stored in two files: a token file and a zone file:

+ **token file** - contains signed tokens with profile data
+ **zone file** - describes where to find the token file

### Lookups

An identity lookup is performed as follows:

1. lookup the name in blockstore's name records and get back the data hash associated with the name
2. lookup the data hash in the blockstore DHT and get back the zone file
3. scan the zone file for "zone origin" records and get the URL found in the "data" field - the token file URL
4. issue a request to the token file URL and get back the token file
5. parse through the token file for tokens and verify that all the tokens have valid signatures and that they can be tied back to the user's name (by using the public keychain)
6. grab all of the claims in the tokens and merge them into a single JSON object, which is the user's profile

### Zone files

A zone file contains an origin (the name registered), a TTL (not yet supported), and a list of records.

Each record has a name, class, type, data, and checksums.

If the value of the "name" field is "@", that means the record corresponds to the "zone origin" of the name.

The "class" field corresponds to the namespace of the record's information. In ICANN DNS, this is traditionally "IN" for Internet, but this field could be changed to something else to indicate that the names are registered in a parallel DNS universe.

The "type" field indicates how the record should be resolved. Only "CNAME" is currently supported. This means that the name record should be interpreted as an alias of the URL that is provided in the "data" field.

The "data" field is interpretted in different ways, depending on the value in the "type" field. As mentioned previously, though, the only supported type at the moment is "CNAME", so the "data" field will contain a URL until that changes.

The "checksums" field indicates values in the parsed profile that should be considered "immutable" fields. One can be certain that the values of these fields cannot change because the values of their hashes must correspond to the corresponding values in the checksum records.

The "publicKeychain" field indicates the keychain that was used to sign the tokens found in the token file.
