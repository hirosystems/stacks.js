---
title: Update User Profile
---

import StacksjsStartersNote from '../../includes/\_stacks.js-starters-note.mdx';
import StacksProviderSection from '../../includes/\_stacks.js-provider-section.mdx';

<StacksjsStartersNote/>

This guide explains how to change the universal profile of an authenticated user.

When a user creates a new account with Hiro Wallet a basic profile is created and stored on the user's own storage hub. The basic profile contains
only a public key. It can be extended to contain personal information like an avatar,name and description. It is always cryptographically signed by the user's key, the so-called owner key.

:::info
Hiro provides a hosting services for storage hubs. Learn about hosting a storage hub at [this tutorial](https://docs.hiro.so/tutorials/gaia-amazon-deploy).
:::

For users with BNS names, the profile can be read by any user. This extended profile can be used by any application to show a personalized user card
like this:

![image](https://user-images.githubusercontent.com/1449049/215344771-455d3345-b890-49d0-9cfa-fd1f92bf5b1e.png)

In order to update the public profile, apps can make request to the Stacks wallet. These requests are reviewed and confirmed by the user in the wallet similar to transaction signing.

## Install dependency

:::tip
In order to utilize the latest profile updating with the Hiro Wallet, use a version >= 7.1.0 of the `@stacks/connect` NPM package.
:::

The following dependency must be installed:

```
npm install @stacks/connect
```

This also installs the NPM package `@stacks/profile`. It contains the data type `PublicPersonProfile` used for the public profile.

## Initiate session

Users must authenticate to an app before you request message signing. Users can install an authenticator like [the Hiro Wallet](https://www.hiro.so/wallet/install-web).

See the [authentication guide](https://docs.hiro.so/build-apps/authentication) before proceeding to integrate the following message signing capabilities.

## Prompt to update the profile

After the user chose the content of the profile, create a `PublicPersonProfile` object from that data and call the `openProfileUpdateRequestPopup` function provided by the `connect` package to trigger the display of the profile update prompt.

```tsx
import { openProfileUpdateRequestPopup } from '@stacks/connect';

const profile = {
  '@type': 'Person',
  '@context': 'https://schema.org',
  name: 'Friedger',
  image: [
    { '@type': 'ImageObject', name: 'avatar', contentUrl: 'https://friedger.de/profile.png' },
  ],
};

openProfileUpdateRequestPopup({
  profile,
  appDetails: {
    name: 'My App',
    icon: 'https://example-app.com/my-app-logo.svg',
  },
  onFinish(data) {
    console.log('Profile published', data);
  },
});
```

Several parameters are available for calling `openProfileUpdateRequestPopup`. Here is the exact interface for them:

```tsx
interface ProfileUpdateRequestOptions {
  profile: PublicPersonProfile;
  onFinish?: (data: PublicPersonProfile) => void;
  onCancel?: () => void;
  appDetails: {
    name: string;
    icon: string;
  };
  authOrigin?: string;
  stxAddress?: string;
  userSession?: UserSession;
}
```

After the profile was updated, the user can share the profile with other users.

## Lookup a Public Profile

The public profile for a given BNS name can be looked up using
the [`stacks.js`](https://github.com/hirosystems/stacks.js) [`lookupProfile`](https://stacks.js.org/functions/_stacks_auth.lookupProfile) method.

The functions takes an object of type `ProfileLookupOptions`

```tsx
export interface ProfileLookupOptions {
  username: string;
  zoneFileLookupURL?: string;
  network?: StacksNetworkName | StacksNetwork;
}
```

The function returns a promise with the data of the public profile if the data could be retrieved from the BNS name owner's storage and if the retrieved JSON token was sucessfully verified.

The recommended schema for the profile is as follows:

```tsx
export interface PublicPersonProfile extends PublicProfileBase {
  '@type': 'Person';
  name?: string;
  givenName?: string;
  familyName?: string;
  description?: string;
  image?: { '@type': 'ImageObject'; name?: string; contentUrl?: string; [k: string]: unknown }[];
  website?: {
    '@type'?: string;
    url?: string;
    [k: string]: unknown;
  }[];
  account?: {
    '@type'?: string;
    service?: string;
    identifier?: string;
    proofType?: string;
    proofUrl?: string;
    proofMessage?: string;
    proofSignature?: string;
    [k: string]: unknown;
  }[];
  worksFor?: {
    '@type'?: string;
    '@id'?: string;
    [k: string]: unknown;
  }[];
  knows?: {
    '@type'?: string;
    '@id'?: string;
    [k: string]: unknown;
  }[];
  address?: {
    '@type'?: string;
    streetAddress?: string;
    addressLocality?: string;
    postalCode?: string;
    addressCountry?: string;
    [k: string]: unknown;
  };
  birthDate?: string;
  taxID?: string;
  [k: string]: unknown;
}
```

## Usage in React Apps

Import the `useConnect` helper from [`connect-react`](https://github.com/hirosystems/connect) package to update profiles more seamlessly with React apps.
You must install a version >= 21.0.0

```
npm install @stacks/connect-react
```

Use the function with the same parameters as outlined above. However, you don't have to specify `appDetails` since they are detected automatically if `useConnect` has been used already [for authentication](/build-apps/authentication#usage-in-react-apps).

```tsx
import { useConnect } from '@stacks/connect-react';

const MyComponent = () => {
  const { doProfileUpdate } = useConnect();

  const onClick = async () => {
    const options = {
      /** See description above */
    };
    await doProfileUpdate(options);
  };

  return <span onClick={onClick}>Update Profile</span>;
};
```

## Profile Update Request / Response Payload

Under the hood, `@stacks/connect` will serialize and deserialize data between your app and the Hiro Wallet.

These payloads are tokens that conform to the [JSON Web Token (JWT) standard](https://tools.ietf.org/html/rfc7519) with additional support for the `secp256k1` curve used by Bitcoin and many other cryptocurrencies.

### Profile Update Request Payload

When an application triggers a profile update from `@stacks/connect`, the options of that profile update request are serialized into a `profileUpdateRequest` payload. The `profileUpdateRequest` is similar to the [authRequest](https://docs.hiro.so/build-apps/authentication#authrequest-payload-schema) payload used for authentication.

The profile update request payload has the following schema, in addition to the standard JWT required fields:

```ts
interface ProfileUpdatePayload {
  profile: PublicPersonProfile;
  publicKey: string;
  /**
   * Provide the Hiro Wallet with a suggested account to sign this transaction with.
   * This is set by default if a `userSession` option is provided.
   */
  stxAddress?: string;
  appDetails?: AuthOptions['appDetails'];
  network?: StacksNetwork;
}
```

### Profile Update Response payload

After the user confirms the update, a `profileUpdateResponse` payload of type `PublicProfile` is sent back to your app. It contains the updated profile as confirmed by the user. Note, that this profile can be different to the requested profile by the app because the user might have modified the profile in the wallet before confirming the changes.

<StacksProviderSection/>
