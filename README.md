# Crypto Profiles

### Installation

```
$ npm install crypto-profiles
```

### Module importing

```es6
import { signProfileTokens, getProfileFromTokens } from 'crypto-profiles'
import { PrivateKeychain, PublicKeychain } from 'elliptic-keychain'
```

```js
var signProfileTokens = require('crypto-profiles').signProfileTokens,
    getProfileFromTokens = require('crypto-profiles').getProfileFromTokens

var PrivateKeychain = require('elliptic-keychain').PrivateKeychain,
    PublicKeychain = require('elliptic-keychain').PublicKeychain
```

### Create a profile

```js
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

### Sign the profile

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

###

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