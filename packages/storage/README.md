# @stacks/storage

Store and fetch files with Gaia, the decentralized storage system.

## Installation

```
npm install @stacks/storage
```

## Usage

### Initiating a storage client

```typescript
import { UserSession } from '@stacks/auth';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig();
const userSession = new UserSession({ appConfig });
const storage = new Storage({ userSession });
```

Note that you can also use an existing `userSession` object created during the authentication process.

### Put file

```typescript
const myData = JSON.stringify({
  hello: "world",
  num: 1
});

storage.putFile('my_data.json', myData));
```

Store data at a different path

```typescript
storage.putFile('path/my_data.json', myData));
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

storage.putFile('my_data.json', myData, putFileOptions));
```

### Get file

```typescript
storage.getFile('my_data.json').then((fileContent) => {
  console.log(fileContent);
});
```

Get file with options

```typescript
const getFileOptions = {
  decrypt: false,
  // by default files stored are signed and can be verified for authenticity
  verify: false
}

storage.getFile('my_data.json', getFileOptions).then((fileContent) => {
  console.log(fileContent);
});
```

### Delete file

```typescript
storage.deleteFile('my_data.json');
```

Delete the file and the corresponding signature file if signed

```typescript
storage.deleteFile('my_data.json', { wasSigned: true });
```

### List file

List all files in the user's Gaia hub

```typescript
storage.listFiles((filename) => {
  if (filename === 'my_data.json') {
    return storage.getFile(filename).then((fileContent) => {
      console.log(fileContent);
      // return false to stop iterating through files
      return false;
    })
  } else {
    // return true to continue iterating
    return true;
  }
});
```
