# @stacks/storage

Store and fetch files with [Gaia](https://docs.stacks.co/build-apps/references/gaia), the decentralized storage system.

## Installation

```
npm install @stacks/storage
```

## Usage

### Initiate a session
Users must authenticate to an app before the storage package will work to save or retrieve data on their behalf.

See also [authentication guide](https://docs.stacks.co/build-apps/guides/authentication) using [connect](https://github.com/blockstack/connect#readme) for web apps

The storage capabilities will work in cases `userSession.isUserSignedIn()` returns `true`

### Initiating a storage client

```typescript
import { UserSession, AppConfig } from '@stacks/auth';
import { Storage } from '@stacks/storage';

const privateKey = '896adae13a1bf88db0b2ec94339b62382ec6f34cd7e2ff8abae7ec271e05f9d8';
const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });
userSession.store.getSessionData().userData = <any> {
  appPrivateKey: privateKey,
};
const storage = new Storage({ userSession });
```

Note that you can also use an existing `userSession` object created during the authentication process.

### Put file

```typescript
const myData = JSON.stringify({
  hello: "world",
  num: 1
});

const fileUrl = await storage.putFile('my_data.json', myData);
// You'll need to save an entirely new string of modified data using putFile with the same fileName every time you want to update a record. 
// There is no separate update method.
```

Store data at a different path

```typescript
const fileUrl = await storage.putFile('path/my_data.json', myData);
```

Put file with options

```typescript
const putFileOptions = {
  // override the default content type
  contentType: 'application/json', 
  // override encrypting data by default
  // you can also set encrypt to a private key to specify a custom encryption key
  encrypt: false, 
  // ignore automatic conflict prevention using etags
  dangerouslyIgnoreEtag: true
}

const fileUrl = await storage.putFile('my_data.json', myData, putFileOptions);
```

### Get file

```typescript
const fileContent = await storage.getFile('my_data.json');
console.log(fileContent);
```

Get file with options

```typescript
const getFileOptions = {
  decrypt: false,
  // by default files stored are signed and can be verified for authenticity
  verify: false
}

const fileContent = await storage.getFile('my_data.json', getFileOptions);
console.log(fileContent);
```

Get file for other user

```typescript
// Retrieve public data saved by users other than the one with the active session
// User should have registered username via BNS
const options = {
  username: 'yukan.id',
  // app: 'https://example.org',
  decrypt: false,
};
// Set an additional app property within options to retrieve data for a user as saved by an app hosted at a separate domain

const fileContent = await storage.getFile('my_data.json', options);
console.log(fileContent);
```

### Delete file

```typescript
await storage.deleteFile('my_data.json');
```

Delete the file and the corresponding signature file if signed

```typescript
await storage.deleteFile('my_data.json', { wasSigned: true });
```

### List file

List all files in the user's Gaia hub

```typescript
const files: Promise<string | undefined | ArrayBuffer | null>[] = [];
const options = { decrypt: false };
await storage.listFiles((filename: string) => {
  if (filename === 'my_data.json') {
    files.push(storage.getFile(filename, options));
    // return false to stop iterating through files
    return false;
  } else {
    // return true to continue iterating
    return true;
  }
});
const fileContents = await Promise.all(files);
```
