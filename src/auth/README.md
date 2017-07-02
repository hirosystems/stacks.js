# Blockstack Auth

SSO and authentication without 3rd parties or remote servers

* [Quickstart](#quickstart)
* [Operations](#operations)
* [Examples](#examples)

## Quickstart

1) Install `blockstack.js`:

```bash
npm install blockstack --save
```

2) Import Blockstack into your project

```js
import blockstack from 'blockstack'
```

3) Wire up a sign in button

```js
document.getElementById('signin-button').addEventListener('click', function() {
  blockstack.redirectToSignIn()
})
```

4) Wire up a sign out button

```js
document.getElementById('signout-button').addEventListener('click', function() {
  blockstack.signUserOut(window.location.origin)
})
```

5) Include the logic to (a) load user data (b) handle the auth response

```js
function showProfile(profile) {
  var person = new blockstack.Person(profile)
  document.getElementById('heading-name').innerHTML = person.name()
  document.getElementById('avatar-image').setAttribute('src', person.avatarUrl())
  document.getElementById('section-1').style.display = 'none'
  document.getElementById('section-2').style.display = 'block'
}

if (blockstack.isUserSignedIn()) {
  blockstack.loadUserData(function(userData) {
    showProfile(userData.profile)
  })
} else if (blockstack.isSignInPending()) {
  blockstack.handlePendingSignIn(function(userData) {
    window.location = window.location.origin
  })
}
```

6) Create a manifest.json file

```json
{
  "name": "Hello, Blockstack",
  "start_url": "localhost:5000",
  "description": "A simple demo of Blockstack Auth",
  "icons": [{
    "src": "https://helloblockstack.com/icon-192x192.png",
    "sizes": "192x192",
    "type": "image/png"
  }]
}
```

7) Serve your application

## Operations

### Request a user to sign in

```es6
import { requestSignIn } from 'blockstack'

const authRequest = blockstack.makeAuthRequest(null, window.location.origin)
blockstack.redirectUserToSignIn(authRequest)
```

### Sign a user in

```es6
import { signUserIn } from 'blockstack'

signUserIn((userData) => {
    // Redirect the user to the home page
})
```

### Create a raw auth request

```es6
import { makeAuthRequest, makeECPrivateKey } from 'blockstack'

const privateKey = makeECPrivateKey()
const authRequest = makeAuthRequest(privateKey)
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
const profile = { "name": "Naval Ravikant" }
const username = "naval.id"
const authResponse = makeAuthResponse(privateKey, profile, username)
```

### Verify an auth response

```
import { verifyAuthResponse } from 'blockstack'

const verified = verifyAuthResponse(authResponse)
```

## Examples

- [Hello, Blockstack](https://github.com/blockstack/blockstack.js/blob/master/tests/browserTests/auth/app.js#L18)
