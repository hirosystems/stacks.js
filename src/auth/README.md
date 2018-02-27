# Blockstack Authentication

Blockstack Authentication provides single sign on and authentication without third parties or remote servers.

* [Overview](#overview)
* [Quickstart](#quickstart)
* [API Reference](http://blockstack.github.io/blockstack.js/index.html#authentication)
* [User flow](#user-flow)
* [Manifest file](#manifest-file)
* [Key pairs](#key-pairs)
* [Scopes](#scopes)
* [Authentication tokens](#authentication-tokens)
* [`blockstack:` custom protocol handler](#blockstack-custom-protocol-handler)
* [Adding Blockstack Authentication to your app](#adding-blockstack-authentication-to-your-app)

## Overview

Blockstack Authentication is a bearer token-based authentication system. From an app user's perspective, it functions similar to legacy third-party authentication techniques that they're familiar with. From an app developers' perspective it's a bit different than a typical client-server based OAuth flow that you've seen with centralized sign in services in that authentication happens entirely on the client side.

## Quickstart

1) Install `blockstack.js`:

```bash
npm install blockstack --save
```

2) Import Blockstack into your project

```js
import * as blockstack from 'blockstack'
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
  const userData = blockstack.loadUserData()
  showProfile(userData.profile)
} else if (blockstack.isSignInPending()) {
  blockstack.handlePendingSignIn(function(userData) {
    showProfile(userData.profile)
  })
}
```

6) Create a `manifest.json` file

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

Make sure your `manifest.json` file has appropriate CORS headers so that it can
be fetched via an http `GET` from any origin.


7) Serve your application

## User flow

What follows is a walk through of the experience of a user, Alice, signing in to your app with Blockstack. 

First, Alice clicks the "Sign in with Blockstack" button on your app. She is redirected to her copy of the Blockstack Browser. The Blockstack Browser shows Alice an approval dialog with information about your app including:

* The origin your app was served from
* Your app's name
* Your app's logo
* The types of permissions and data your app is requesting

Alice can choose to authenticate as one of her Blockstack IDs by selecting the ID and clicking the Approve button.

When she clicks approve, she's redirected back to your app. Your app gets cryptographic proof that she is who she claims to be, access to a dedicated bucket in her Gaia storage hub for your app to read and write its own data along with public information she's stored in her profile.

## Manifest file

Blockstack apps have a manifest file based on the [W3C web app manifest specification](https://w3c.github.io/manifest/). The Blockstack Browser retrieves the manifest file from the app during the authentication process and displays some of the information in it such as the app name and icon to the user. The location of the app manifest file is specific in the authentication request token and *MUST* be on the same origin as the app requesting authentication.

Below is an example of a manifest file:

```
{
  "name": "Todo App",
  "start_url": "http://blockstack-todos.appartisan.com",
  "description": "A simple todo app build on blockstack",
  "icons": [{
    "src": "http://blockstack-todos.appartisan.com/logo.png",
    "sizes": "400x400",
    "type": "image/png"
  }]
}
```

The manifest file *MUST* have [Cross-origin resource sharing (CORS) headers](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) that allow the manifest file to be fetched from any arbitrary source. This usually means returning  

## Key pairs

Blockstack Authentication makes extensive use of public key cryptography. As mentioned above, we use ECDSA with the secp256k1 curve. What follows is a description of the various public-private key pairs used in the authentication process including how they're generated, where they're used and to whom the private key is disclosed.

### Transit private key

The transit private is an ephemeral key that is used to encrypt secrets that need to be passed from the Blockstack Browser to the app during the authentication process. It is randomly generate by the app at the beginning of the authentication response. The public key that corresponds to the transit private key is stored in a single element array in the `public_keys` key of the authentication request token. The Blockstack Browser encrypts secret data such as the app private using this public key and sends it back to the app when the user signs in to the app. The transit private key signs the app authentication request.

### Blockstack ID Identity address private key
The identity address private key is derived from the user's keychain phrase and is the private key of the Blockstack ID that the user chooses to use to sign in to the app. It is a secret owned by the user and never leaves the user's instance of the Blockstack browser. This private key signs the authentication response token for an app to indicate that the user approves sign in to that app.

### App private key

The app private key is an app-specific private key that is generated from the user's identity address private key using the `domain_name` as input. It is deterministic in that for a given Blockstack ID and `domain_name`, the same private key will be generated each time. The app private key is securely shared with the app on each authentication, encrypted by the Blockstack browser with the transit public key.  

The app private key serves three functions. 
* It is used to create the credentials that give an app access to the gaia hub storage bucket for that specific app. 
* It is used in the end-to-end encryption of files stored for the app on the user's gaia hub. 
* It serves as a cryptographic secret that apps can use to perform other cryptographic functions.

## Scopes
Scopes define the information and permissions an app requests from the user during authentication. If no `scopes` array is provided to the `redirectToSignIn` or `makeAuthRequest` functions.
- `store_write` - read and write data to the user's Gaia hub in an app-specific storage bucket
- `publish_data` - publish data so that other users of the app can discover and interact with the user
- `email` - requests the user's email if available

## Authentication tokens

Communication between the app requesting authentication and the Blockstack Browser, the component that authenticates the user, happens via a protocol based on passing JSON web tokens via the URL query string. There are two types of authentication tokens, the authentication request token which is generated by an app requesting authentication of a user and sent to the user's Blockstack Browser and the authentication response token which is sent from the Blockstack Browser to the app when the user approved sign in to the app.

### JSON Web Token signatures

Blockstack's authentication tokens are based on the [ RFC 7519 OAuth JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519) with additional support for the secp256k1 curve used by bitcoin and many other cryptocurrencies.

This support is indicated by specifying `ES256K` in the `alg` key to indicated that the JWT signature uses ECDSA using the secp256k1 curve.  We provide both [JavaScript](https://github.com/blockstack/jsontokens-js) and [Ruby](https://github.com/blockstack/ruby-jwt-blockstack/tree/ruby-jwt-blockstack) JWT libraries with support for this curve.

### Authentication request payload schema

``` JavaScript
const requestPayload = {
    jti, // UUID
    iat, // JWT creation time in seconds
    exp, // JWT expiration time in seconds
    iss, // legacy decentralized identifier generated from transit key
    public_keys, // single entry array with public key of transit key
    domain_name, // app origin
    manifest_uri, // url to manifest file - must be hosted on app origin
    redirect_uri, // url to which browser redirects user on auth approval - must be hosted on app origin
    version, // version tuple
    do_not_include_profile, // a boolean flag asking browser to send profile url instead of profile object
    supports_hub_url, // a boolean flag indicating gaia hub support
    scopes // an array of string values indicating scopes requested by the app
  }
```
 
  
### Authentication response payload schema
  
```JavaScript
    const responsePayload = {
    jti, // UUID
    iat, // JWT creation time in seconds
    exp, // JWT expiration time in seconds
    iss, // legacy decentralized identifier (string prefix + identity address) - this uniquely identifies the user
    private_key, // encrypted private key payload
    public_keys, // single entry array with public key
    profile, // profile object or null if passed by profile_url
    username, // blockstack id username (if any)
    core_token, // encrypted core token payload
    email, // email if email scope is requested & email available
	  profile_url, // url to signed profile token
    hubUrl, // url pointing to user's gaia hub
    version // version tuple
  }
```
  
## `blockstack:` custom protocol handler

The `blockstack:` custom protocol handler is how Blockstack apps send their authentication requests to the Blockstack Browser. When the Blockstack Browser is installed on a user's computer, it registers itself as the handler for the `blockstack:` customer protocol.

When apps call [`redirectToSignIn`](http://blockstack.github.io/blockstack.js/index.html#redirecttosignin) or [`redirectToSignInWithAuthRequest`](http://blockstack.github.io/blockstack.js/index.html#redirecttosigninwithauthrequest), the code tries to check if a handler for the `blockstack:` custom protocol is installed and, if so, redirects the user to `blockstack:<authRequestToken>`. This causes the authentication request token to be passed from the app to the Blockstack Browser which in turn validates the request, displays information about the app to the user and asks the user if she wants to approve sign in to the app.

## Adding Blockstack Authentication to your app

The way you can add Blockstack Authentication to you app depends on whether your app is a modern decentralized Blockstack App where code runs client-side without trusted servers or a legacy client-server app where a server is trusted. 

### Authentication in Client-side apps
This method is appropriate for decentralized client-side apps where the user's zone of trust - the parts of the app that the user is trusting - begins and ends with the code running on their own computer. In apps like these, any code the app interacts with that's not on their own computer such as external servers does not need to know who she is.

[Blockstack.js](https://github.com/blockstack/blockstack.js) provides API methods that help you to implement Blockstack Authentication in your client-side app.  

#### Standard flow
The preferred way to implement authentication in these apps is to use the standard flow. This flow hides much of the process behind a few easy function calls and makes it very fast to get up and running.

In this process you'll use these four functions:

- `redirectToSignIn`
- `isSignInPending`
- `handlePendingSignIn`
- `loadUserData`

##### Starting the sign in process

When your app wants to start the sign in process, typically when the user clicks a "Sign in with Blockstack" button, your app will call the [`redirectToSignIn`](http://blockstack.github.io/blockstack.js/index.html#redirecttosignin) method of [blockstack.js](https://github.com/blockstack/blockstack.js). 

This creates an ephemeral transit key, stores it in the web browser's `localStorage`, uses it to create an authentication request token and finally redirects the user to the Blockstack browser to approve the sign in request.

##### Handling an authentication response

When a user approves a sign in request, the Blockstack Browser will return the signed authentication response token to the `redirectURI` specified in `redirectToSignIn`. To check for the presence of this token, your app calls `isSignInPending` and if this returns `true` you then call the `handlePendingSignIn` which decodes the token and returns the signed in user's data and simultaneously storing it to `localStorage` so that it can be retrieved later with `loadUserData`.

```js
import * as blockstack from 'blockstack'

if (blockstack.isSignInPending()) {
    blockstack.handlePendingSignIn()
    .then(userData => {
        const profile = userData.profile
    })
} 

```

#### Manual flow

Alternatively, you can manually generate your own transit private key and/or authentication request token. This gives you more control over the experience.

For example, you could use the following code to generate an authentication request on `https://alice.example.com` or `https://bob.example.com` for an app running on origin `https://example.com`.

```js

const transitPrivateKey = generateAndStoreTransitKey()
const redirectURI = 'https://example.com/authLandingPage'
const manifestURI = 'https://example.com/manifest.json'
const scopes = ['scope_write', 'publish_data']
const appDomain = 'https://example.com'

const authRequest = makeAuthRequest(transitPrivateKey, redirectURI, scopes, appDomain)

redirectToSignInWithAuthRequest(authRequest)
```

### Authentication in client-server apps

*Note: Client-server authentication requires using a library written in the language of your server app. There are private methods in blockstack.js that can be accomplish this on node.js server apps, but they are not currently part of our public, supported API.*

Using Blockstack Authentication in client-server apps is very similar to client-side apps. You generate the authentication request using the same code in the client as described above.

The main difference is that you need to verify the authentication response token on the server after the user approves sign in to your app. 

For an example of how verification can be done server side, take a look at the [blockstack-ruby](https://github.com/blockstack/blockstack-ruby#to-verify-an-auth-response) library.