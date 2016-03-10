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
      "name": "Jeff Koons",
      "id": "therealjeffkoons.id"
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
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NksifQ.eyJjbGFpbSI6eyJAY29udGV4dCI6Imh0dHA6Ly9zY2hlbWEub3JnLyIsIkB0eXBlIjoiQ3JlYXRpdmVXb3JrIiwibmFtZSI6IkJhbGxvb24gRG9nIiwiY3JlYXRvciI6W3siQHR5cGUiOiJQZXJzb24iLCJuYW1lIjoiSmVmZiBLb29ucyIsImlkIjoidGhlcmVhbGplZmZrb29ucy5pZCJ9XSwiZGF0ZUNyZWF0ZWQiOiIxOTk0LTA1LTA5VDAwOjAwOjAwLTA0MDAiLCJkYXRlUHVibGlzaGVkIjoiMjAxNS0xMi0xMFQxNDo0NDoyNi0wNTAwIn0sInN1YmplY3QiOiIwMmIzMTllZjJkZGM0NjYyNzZiM2QxNDg3MTJlYmM3ZWUxNTkzYzI4YjNkMzdiZDZmZGEyNDI1NjVmZDE0OTAwMmQiLCJpc3N1ZWRBdCI6IjIwMTYtMDItMDNUMDY6MjQ6NDMuNzQ1WiIsImV4cGlyZXNBdCI6MTQ4NjEwMzA4Mzc0NX0.lpw10Jy--NMe2Tn_Rc1AXYm6TcFw1TdbVZ_dBECte5tKTDIbnNNO80mvNkrofT3YZEQb36jLEfiijiao7gM0Cw",
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
              "name": "Jeff Koons",
              "id": "therealjeffkoons.id"
            }
          ],
          "dateCreated": "1994-05-09T00:00:00-0400",
          "datePublished": "2015-12-10T14:44:26-0500"
        },
        "subject": "02b319ef2ddc466276b3d148712ebc7ee1593c28b3d37bd6fda242565fd149002d",
        "issuedAt": "2016-02-03T06:24:43.745Z",
        "expiresAt": 1486103083745
      },
      "signature": "lpw10Jy--NMe2Tn_Rc1AXYm6TcFw1TdbVZ_dBECte5tKTDIbnNNO80mvNkrofT3YZEQb36jLEfiijiao7gM0Cw"
    },
    "publicKey": "02b319ef2ddc466276b3d148712ebc7ee1593c28b3d37bd6fda242565fd149002d",
    "parentPublicKey": "027d82d4bc3c270573a6d822b9c1068f721753780b095c35412547ab8d149c4448",
    "derivationEntropy": "e15dfbe9986d8914fac948a131426c57a940185e298368e22ad34fedeb47a110",
    "encrypted": false
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
var zonefileData = {
  "$origin": "MYDOMAIN.COM.",
  "$ttl": 3600,
  "a": [
    { "name": "@", "ip": "127.0.0.1" },
    { "name": "www", "ip": "127.0.0.1" }
  ]
}

var zonefile = new Zonefile(zonefileData)
```

### Output the zone file as a string

```js
var zonefileString = zonefile.toString()
```

### Output the zone file to JSON

```js
var zonefileJson = zonefile.toJSON()
```

## Wiki

### Usernames

A blockchain ID = a name + a profile, registered on a blockchain.

Let's say you register the username 'alice' within the 'id' namespace, the default namespace for usernames. Then your username would be expressed as `alice.id`.

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
