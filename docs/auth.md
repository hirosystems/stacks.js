# Blockstack Auth

## How to Integrate

### Single-page Apps

1) Install `blockstack.js`:

```bash
npm install blockstack --save
```

2) Import Blockstack into your project

```js
import blockstack from 'blockstack'
```

3) Include the logic to (a) request the user to sign in (b) handling the auth response

```js
if (blockstack.isUserSignedIn()) {
  blockstack.loadUserData(function(userData) {
    showProfile(userData.profile)
  })
} else if (blockstack.isSignInPending()) {
  blockstack.signUserIn(function(userData) {
    window.location = window.location.origin
  })
}
```

### Client-server Apps

Coming soon.

## Examples

### Single-page Apps

- [Hello, Blockstack](https://github.com/blockstack/blockstack.js/blob/master/tests/browserTests/auth/app.js#L18)

### Client-server Apps

- [Blockstack Forum](https://forum.blockstack.org)
