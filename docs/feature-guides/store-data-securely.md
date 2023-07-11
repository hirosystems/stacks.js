---
title: Store Data Securely
---

import StacksjsStartersNote from '../includes/\_stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

This guide explains how to save and retrieve data for users with [Gaia](https://docs.stacks.co/build-apps/references/gaia) by implementing the [`connect`](https://github.com/hirosystems/connect/) and [`storage`](https://stacks.js.org/modules/storage.html) packages of Stacks.js.

Data storage provides a way for users to save both public and private data off-chain while retaining complete control over it.

Storing data off the Stacks blockchain ensures that apps can provide users with high performance and high availability for data reads and writes without the involvement of centralized parties that could compromise their privacy or accessibility.

See the To-dos app tutorial for a concrete example of this feature in practice.

## Install dependencies

The following dependencies must be installed:

```
npm install @stacks/connect @stacks/storage
```

## Initiate session

Users must authenticate to an app before the `storage` package will work to save or retrieve data on their behalf.

See the authentication guide before proceeding to integrate the following data storage capabilities in cases where `userSession.isUserSignedIn()` returns `true`.

## Save data for session user

Gaia serves as a key-value store in which data is saved and retrieved as files to and from Gaia hubs owned by, or managed for, users.

The default Gaia hub for users who authenticate to apps with [the Stacks Wallet](https://www.hiro.so/wallet/install-web) is run by Hiro PBC at `https://gaia.blockstack.org/`. It supports files up to 25 megabytes in size.

:::tip
Hiro recommends breaking data instances greater than 25 MB into several files, saving them individually, and recomposing them on retrieval.
:::

These files can comprise any type of data such as text, image, video or binary.

Files are often saved as strings that represent stringified JSON objects and contain a variety of properties for a particular model.

To save a file, first instantiate a `storage` object using the `userSession` object for an authenticated user. Then proceed to call its `putFile` method with relevant parameters:

```js
import { AppConfig, UserSession } from '@stacks/connect';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const storage = new Storage({ userSession });

let fileName = 'car.json';

let fileData = {
  color: 'blue',
  electric: true,
  purchaseDate: '2019-04-03',
};

const options = {
  encrypt: true,
};

let fileUrl = storage.putFile(fileName, JSON.stringify(fileData), options).then(() => {
  // Handle any execution after data has been saved
});
```

The `options` parameter object contains an `encrypt` property that when set to `true` indicates that the data should be encrypted with the user's app private key before saved to their Gaia hub. All data will be encrypted as such by default if the `encrypt` property or the `options` object itself is omitted entirely.

If the `encrypt` property is set to `false`, the data will be saved completely unencrypted and available to everyone online with public access to the user's Gaia hub.

Whereas saving privately encrypted data is possible for all authenticated apps with the [`store_write`](https://stacks.js.org/enums/auth.AuthScope.html#store_write) scope, the user must have previously granted the [`publish_data`](https://stacks.js.org/enums/auth.AuthScope.html#publish_data) scope as well during authentication for the app to save publicly unencrypted data.

The `putFile` method returns the URL where the the file can be retrieved from the user's Gaia hub, as used here to set the value of `fileUrl`.

:::info
You'll need to save an entirely new string of modified data using `putFile` with the same `fileName` every time you want to update a record. There is no separate update method.
:::

## Get data for session user

To retrieve data previously saved for a user with an app, call the `getFile` method available from the `storage` object:

```js
import { AppConfig, UserSession } from '@stacks/connect';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const storage = new Storage({ userSession });

let fileName = 'car.json';

const options = {
  decrypt: true,
};

storage.getFile(fileName, options).then(fileData => {
  // Handle any execution that uses decrypted fileData
});
```

Note how the `decrypt` property in the `options` object here should implement the same boolean value as used for `encrypt` initially upon saving the data with `putFile`. The `decrypt` property will default to `true` if omitted.

Encrypted files need `decrypt` set to `true` so the app knows to decrypt the data with the user's app private key before made available in the callback here as `fileData`.

## Get data for other user

Apps can also retrieve public data saved by users other than the one with the active session, granted those users have registered usernames via the [Blockchain Naming System](https://docs.stacks.co/build-apps/references/bns).

Simply indicate the username of such a user in the `options` object:

```js
import { AppConfig, UserSession } from '@stacks/connect';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const storage = new Storage({ userSession });

let fileName = 'car.json';

const options = {
  username: 'markmhendrickson.id.blockstack',
};

storage.getFile(fileName, options).then(fileData => {
  // Handle any execution that uses decrypted fileData
});
```

This `getFile` call will retrieve data found at the given `fileName` path from the storage bucket of the Gaia hub that maps to the user who registered the given `username` and this particular app as hosted at the current domain.

Set an additional `app` property within `options` to retrieve data for a user as saved by an app hosted at a separate domain:

```js
const options = {
  app: 'https://example.org',
  username: 'markmhendrickson.id.blockstack',
};
```

This will cause the `getFile` call to retrieve data found in a separate storage bucket for the indicated app on the user's Gaia hub.

## Delete data for session user

Call the `deleteFile` method on `storage` to remove data found at a particular file path for the active session user:

```js
import { AppConfig, UserSession } from '@stacks/connect';
import { Storage } from '@stacks/storage';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });
const storage = new Storage({ userSession });

let fileName = 'car.json';

storage.deleteFile(fileName).then(() => {
  // Handle any execution after file has been deleted
});
```

:::info
Apps can save and delete data only for the active session user.
:::
