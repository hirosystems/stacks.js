# Migration Guides

- [Stacks.js (&lt;=4.x.x) → (5.x.x)](#stacksjs-4xx--5xx)
  - [Breaking Changes](#breaking-changes)
    - [Buffer to Uint8Array](#buffer-to-uint8array)
    - [Message Signing Prefix](#message-signing-prefix)
- [blockstack.js → Stacks.js (1.x.x)](#blockstackjs--stacksjs-1xx)
  - [Auth](#auth)
  - [Using blockstack.js](#using-blockstackjs)
    - [Using Blockstack Connect](#using-blockstack-connect)
  - [Storage](#storage)
    - [Using blockstack.js](#using-blockstackjs-1)
    - [Using @stacks/storage](#using-stacksstorage)
  - [Encryption](#encryption)
    - [Using blockstack.js](#using-blockstackjs-2)
    - [Using @stacks/encryption or @stacks/auth](#using-stacksencryption-or-stacksauth)

## Stacks.js (&lt;=4.x.x) → (5.x.x)

### Breaking Changes

- To reduce the bundle sizes of applications using Stacks.js, we are switching from Buffer (a polyfill to match Node.js APIs) to Uint8Arrays (which Buffers use in the background anyway). [Read more...](#buffer-to-uint8array)
- To allow message signing on Ledger hardware wallets, we are changing the message signing prefix. [Read more...](#message-signing-prefix)
- Post-conditions for NFTs were renamed to be more clear: `Owns` to `DoesNotSend`, `DoesNotOwn` to `Sends`.

#### Buffer to Uint8Array

To make the switch easier we have introduced a bunch of methods for converting between strings and Uint8Arrays: `hexToBytes`, `bytesToHex`, `utf8ToBytes`, `bytesToUtf8`, `asciiToBytes`, `bytesToAscii`, and `concatBytes`.
To migrate, switch `Buffer` code to instead use `Uint8Array`.
The following code segments are the equivalent calls using Uint8Array rather than Buffers and assuming imports from `@stacks/common` — `import { hexToBytes, bytesToHex, utf8ToBytes, bytesToUtf8, asciiToBytes, bytesToAscii, concatBytes } from "@stacks/common"`

```ts
// old:
Buffer.from('stacks Ӿ'); // <Buffer 73 74 61 63 6b 73 20 d3 be>

// new:
utf8ToBytes('stacks Ӿ'); // Uint8Array(9) [ 115, 116, 97, 99, 107, 115, 32, 211, 190 ];
```

```ts
// old:
Buffer.from([115, 116, 97, 99, 107, 115, 32, 211, 190]).toString(); // 'stacks Ӿ'

// new:
bytesToUtf8(Uint8Array.from([115, 116, 97, 99, 107, 115, 32, 211, 190])); // 'stacks Ӿ'
```

```ts
// old:
Buffer.from('stacks $', 'ascii'); // <Buffer 73 74 61 63 6b 73 20 24>

// new:
asciiToBytes('stacks $'); // Uint8Array(8) [ 115, 116, 97, 99, 107, 115, 32, 36 ]
```

```ts
// old:
Buffer.from([115, 116, 97, 99, 107, 115, 32, 36]).toString('ascii'); // 'stacks $'

// new:
bytesToAscii(Uint8Array.from([115, 116, 97, 99, 107, 115, 32, 36])); // 'stacks $'
```

```ts
// old:
Buffer.from('deadbeef', 'hex'); // <Buffer de ad be ef>

// new:
hexToBytes('deadbeef'); // Uint8Array(4) [ 222, 173, 190, 239 ]
```

```ts
// old:
Buffer.from([222, 173, 190, 239]).toString('hex'); // 'deadbeef'

// new:
bytesToHex(Uint8Array.from([222, 173, 190, 239])); // 'deadbeef'
```

#### Message Signing Prefix

The message signing prefix was changed from `Stacks Message Signing` to `Stacks Signed Message`.
The change relates to the functions `verifyMessageSignature`, `encodeMessage`, `decodeMessage`, and `hashMessage`.
The `verifyMessageSignature` functions was updated to verify against both the old and the new prefix (for unhashed message-input).
This will generate a different hash/signature from the same input compared to previous versions of Stacks.js.
If you have previously stored messages/signatures and compare to freshly generated ones, the messages/signatures will not match to previously stored.

---

## blockstack.js → Stacks.js (1.x.x)

This guide will help migrate your Blockstack app from blockstack.js to the new Stacks.js packages and Connect.

### Auth <!-- omit from toc -->

The main change for auth is that the Stacks Connect library has replaced the `redirectToSignIn` function from blockstack.js.
Instead of redirecting to the now deprecated Blockstack Browser, the authentication flow is completed within a popup window using
the new authenticator app.
You can still use the API in `@stacks/auth` to create custom auth requests manually if desired.

### Using blockstack.js

```typescript
import { UserSession, AppConfig } from 'blockstack';

// Configuring your app
const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });

// Initiating auth flow
if (!userSession.isUserSignedIn()) {
  userSession.redirectToSignIn();
}

// Handling sign in
if (userSession.isSignInPending()) {
  userSession.handlePendingSignIn().then(userData => {
    window.history.replaceState({}, document.title, '/');
    this.setState({ userData: userData });
  });
}
```

#### Using Blockstack Connect

See full tutorial [here](https://docs.blockstack.org/authentication/connect)

```typescript
// Configuring your app
const authOptions = {
  redirectTo: '/',
  finished: ({ userSession }) => {
    console.log(userSession.loadUserData());
  },
  appDetails: {
    name: 'My Cool App',
    icon: 'https://example.com/icon.png',
  },
};

import { showBlockstackConnect } from '@stacks/connect';
import { UserSession, AppConfig } from '@stacks/auth';
import { Connect } from '@stacks/connect';

// Initiating auth flow - using the Connect component
const App = () => <Connect authOptions={authOptions}>// the rest of your app's components</Connect>;

// Initiating auth flow - alternatively
showBlockstackConnect(authOptions);

// Handling sign in
const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });

// ... call this code on page load
if (userSession.isSignInPending()) {
  const userData = await userSession.handlePendingSignIn();
  // your user is now logged in.
}
```

### Storage

In Stacks.js, storage is now a separate package.

#### Using blockstack.js

```typescript
import { UserSession, AppConfig } from 'blockstack';

const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });

userSession.putFile('my_file.json', my_content);
userSession.getFile('my_file.json').then(file => {});
```

#### Using @stacks/storage

```typescript
import { UserSession } from '@stacks/auth';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });
const storage = new Storage({userSession});

storage.putFile('my_file.json', my_content));
storage.getFile('my_file.json').then((file) => {

});

```

### Encryption

Encryption/Decryption functions have been moved into a separate `@stacks/encryption` library.

#### Using blockstack.js

```typescript
import { encryptContent, decryptContent } from 'blockstack';

encryptContent(userSession, content, options);
decryptContent(userSession, encryptedContent, options);
```

#### Using @stacks/encryption or @stacks/auth

```typescript
import { encryptContent, decryptContent } from '@stacks/encryption';
import { UserSession } from '@stacks/auth';

encryptContent(content, { privateKey });
decryptContent(encryptedContent, { privateKey });

// Using userSession
const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });
const storage = new Storage(userSession);

userSession.encryptContent(content);
userSession.decryptContent(encryptedContent);
```
