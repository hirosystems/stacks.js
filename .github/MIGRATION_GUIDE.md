# blockstack.js to Stacks.js migration guide

This guide will help migrate your Blockstack app from blockstack.js to the new Stacks.js packages and Connect.

## Auth

The main change for auth is that the Stacks Connect library has replaced the `redirectToSignIn` function from blockstack.js. 
Instead of redirecting to the now deprecated Blockstack Browser, the authentication flow is completed within a popup window using
the new authenticator app.
You can still use the API in `@stacks/auth` to create custom auth requests manually if desired.

### Using blockstack.js
```typescript
import { UserSession, AppConfig } from 'blockstack';

// Configuring your app
const appConfig = new AppConfig()
const userSession = new UserSession({ appConfig })

// Initiating auth flow
if(!userSession.isUserSignedIn()) {
  userSession.redirectToSignIn();
}

// Handling sign in
if (userSession.isSignInPending()) {
  userSession.handlePendingSignIn().then((userData) => {
    window.history.replaceState({}, document.title, "/");
    this.setState({ userData: userData});
  });
}
```

### Using Blockstack Connect
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
const appConfig = new AppConfig()
const userSession = new UserSession({ appConfig });

// ... call this code on page load
if (userSession.isSignInPending()) {
  const userData = await userSession.handlePendingSignIn();
  // your user is now logged in.
}

```

## Storage
In Stacks.js, storage is now a separate package. 

### Using blockstack.js
```typescript
import { UserSession, AppConfig } from 'blockstack';

const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });

userSession.putFile('my_file.json', my_content);
userSession.getFile('my_file.json').then((file) => {

});

```

### Using @stacks/storage
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

## Encryption

Encryption/Decryption functions have been moved into a separate `@stacks/encryption` library.

### Using blockstack.js
```typescript
import { encryptContent, decryptContent } from 'blockstack';

encryptContent(userSession, content, options);
decryptContent(userSession, encryptedContent, options);

```

### Using @stacks/encryption or @stacks/auth

```typescript
import { encryptContent, decryptContent } from '@stacks/encryption'
import { UserSession } from '@stacks/auth'

encryptContent(content, { privateKey })
decryptContent(encryptedContent, { privateKey })

// Using userSession
const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });
const storage = new Storage(userSession);

userSession.encryptContent(content);
userSession.decryptContent(encryptedContent);
```