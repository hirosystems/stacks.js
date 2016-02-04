# Crypto Profiles

[![npm](https://img.shields.io/npm/l/crypto-profiles.svg)](https://www.npmjs.com/package/crypto-profiles)
[![npm](https://img.shields.io/npm/v/crypto-profiles.svg)](https://www.npmjs.com/package/crypto-profiles)
[![npm](https://img.shields.io/npm/dm/crypto-profiles.svg)](https://www.npmjs.com/package/crypto-profiles)
[![Slack](http://slack.blockstack.org/badge.svg)](http://slack.blockstack.org/)

## Contents

* [Getting Started](#getting-started)
    * [Installation](#installation)
    * [Importing](#importing)
* [Profiles](#profiles)
* [Zonefiles](#zonefiles)

A library for working with cryptographically-signed JSON profiles.

This library can be used to:

1. transform a JSON profile into signed tokens
1. recover a JSON profile from signed tokens
1. validate signed profile tokens

*Note: this document uses ES6 in its examples but it is compiled down to and is perfectly compatible with use of Javascript (ES5). If you're using the latter, you'll just have to make a few adjustments to the examples below (e.g. use "let" instead of "var").*

## Getting Started

### Installation

```
$ npm install crypto-profiles
```

### Importing

#### ES6

```es6
import { signProfileTokens, getProfileFromTokens, Person } from 'crypto-profiles'
import { PrivateKeychain, PublicKeychain } from 'elliptic-keychain'
```

#### Node

```es6
var signProfileTokens = require('crypto-profiles').signProfileTokens,
    getProfileFromTokens = require('crypto-profiles').getProfileFromTokens

var PrivateKeychain = require('elliptic-keychain').PrivateKeychain,
    PublicKeychain = require('elliptic-keychain').PublicKeychain
```

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
> var tokenRecords = signProfileTokens([balloonDog], privateKeychain)
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

## Zonefiles

### Create a zonefile object

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

### Output the zonefile as a string

```js
var zonefileString = zonefile.toString()
```

### Output the zonefile to JSON

```js
var zonefileJson = zonefile.toJSON()
```