---
title: Sign Messages
---

import StacksjsStartersNote from '../includes/stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

This guide explains how to prompt users to sign a message.

The user will be prompted a popup from the Hiro Wallet showing the message you would like them to sign.

The user can then click on the ‘Sign’ button which will return the signature data and the user's publicKey to your app. You can then verify the signature by passing the signature data and the public key to the [`stacks.js`](https://github.com/hirosystems/stacks.js) `verifySignature` method.

The message can be any utf-8 string.

Internally the string will be hashed using `sha256` and signed with `secp256k1` using the user's privateKey

## Install dependency

:::tip

In order to utilize the latest transaction signing with the Hiro Wallet, use a version >= 6.6.0 of the `@stacks/connect` NPM package.

:::

The following dependency must be installed:

```
npm install @stacks/connect
```

## Initiate session

Users must authenticate to an app before you request message signing. Users can install an authenticator like [the Hiro Wallet](https://www.hiro.so/wallet/install-web).

See the [authentication guide](https://docs.hiro.so/build-apps/authentication) before proceeding to integrate the following message signing capabilities.

## Prompt to sign a message

Call the `openSignatureRequestPopup` function provided by the `connect`  package to trigger the display of the message signing prompt.

```tsx
import { openSignatureRequestPopup } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

const message = 'Hello World';

openSignatureRequestPopup({
  message,
  network: new StacksTestnet(), // for mainnet, `new StacksMainnet()`
  appDetails: {
    name: 'My App',
    icon: window.location.origin + '/my-app-logo.svg',
  },
  onFinish(data) {
    console.log('Signature of the message', data.signature);
    console.log('Use public key:', data.publicKey);
  },
});
```

Several parameters are available for calling `openSignatureRequestPopup`. Here's the exact interface for them:

```tsx
interface SignatureRequestOptions {
  message: string;
  onFinish?: (data: SignatureData) => void;
  onCancel?: (data: SignatureData) => void;
  appDetails: {
    name: string;
    icon: string;
  };
  authOrigin?: string;
  stxAddress?: string;
  userSession?: UserSession;
}
```

## Getting the signed message back after completion

The `openSignatureRequestPopup` signing method from `@stacks/connect` allows you to specify an `onFinish` callback.
This callback will be triggered after the user has successfully signed the message.

You can get the signature of the message via the arguments passed to `onFinish`. Your callback will be fired with a single argument, which is an object with the following properties:

```ts
export interface SignatureData {
  /* Hex encoded DER signature */
  signature: string;
  /* Hex encoded private string taken from privateKey */
  publicKey: string;
}
```

```ts
const onFinish = (data: SignatureData) => {
  console.log('Signature', data.signature);
  console.log('PublicKey', data.publicKey);
};
```

## How to verify a signature

You can easily verify the signature using the [`@stacks/stacks.js`](https://github.com/hirosystems/stacks.js) package as seen in the following example.

```ts
import { verifyMessageSignatureRsv } from '@stacks/encryption';

const message = 'Hello World';

openSignatureRequestPopup({
  // ...
  onFinish({ publicKey, signature }) {
    const verified = verifyMessageSignatureRsv({ message, publicKey, signature });
    if (verified) {
      // Trigger a notification explaining signature is verified
    }
  },
});
```

## Specifying the network for a transaction {#network-option}

All of the methods included on this page accept a `network` option. By default, Connect uses a testnet network option. You can import a network configuration from the [`@stacks/network`](https://stacks.js.org/modules/network.html) package.

```ts
import { StacksTestnet, StacksMainnet } from '@stacks/network';

const testnet = new StacksTestnet();
const mainnet = new StacksMainnet();

// use this in your messe signing method:

openSignatureRequestPopup({
  network: mainnet,
  // other relevant options
});
```

## Usage in React Apps

Import the `useConnect` helper from [`connect-react`](https://github.com/hirosystems/connect) package to sign messages more seamlessly with React apps.
You must install a version >= 15.0.0

```
npm install @stacks/connect-react
```

Use the function with the same parameters as outlined above. However, you don't have to specify `appDetails` since they are detected automatically if `useConnect` has been used already [for authentication](/build-apps/authentication#usage-in-react-apps).

```tsx
import { useConnect } from '@stacks/connect-react';

const MyComponent = () => {
  const { sign } = useConnect();

  const onClick = async () => {
    const options = {
      /** See examples above */
    };
    await sign(options);
  };

  return <span onClick={onClick}>Sign message</span>;
};
```

## Signature request / response payload

Under the hood, `@stacks/connect` will serialize and deserialize data between your app and the Hiro Wallet.

These payloads are tokens that conform to the [JSON Web Token (JWT) standard](https://tools.ietf.org/html/rfc7519) with additional support for the `secp256k1` curve used by Bitcoin and many other cryptocurrencies.

### Signature Request Payload

When an application triggers a message signing from `@stacks/connect`, the options of that signature request are serialized into a `signatureRequest` payload. The `signatureRequest` is similar to the [authRequest](https://docs.hiro.so/build-apps/authentication#authrequest-payload-schema) payload used for authentication.

The signature request payload has the following schema, in addition to the standard JWT required fields:

```ts
interface SignatureRequestPayload {
  message: string;
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

### Signature Response payload

After the user signs the message, a `signatureResponse` payload is sent back to your app.

```ts
interface SignatureData {
  /* Hex encoded DER signature */
  signature: string;
  /* Hex encoded private string taken from privateKey */
  publicKey: string;
}
```

## StacksProvider injected variable

When users have the [Hiro Wallet](https://www.hiro.so/wallet/install-web) extension installed, the extension will inject a global `StacksProvider` variable into the JavaScript context of your web app. This allows your JavaScript code to hook into the extension, and make authentication, transaction and signature requests. `@stacks/connect` automatically detects and uses this global variable for you.

At the moment, only the Hiro Wallet extension includes a `StacksProvider`, however, ideally more wallets (and mobile wallets) will support this format, so that your app can be compatible with any Stacks wallet that has functionality to embed web applications.

In your web application, you can check to see if the user has a compatible wallet installed by checking for the presence of `window.StacksProvider`.

Here is the interface for the `StacksProvider` variable.

```ts
interface StacksProvider {
  /** @deprecated */
  getURL: () => Promise<string>;
  /**
   * Make a transaction request
   *
   * @param payload - a JSON web token representing a transaction request
   */
  transactionRequest(payload: string): Promise<FinishedTxPayload | SponsoredFinishedTxPayload>;
  /**
   * Make an authentication request
   *
   * @param payload - a JSON web token representing an auth request
   *
   * @returns an authResponse string in the form of a JSON web token
   */
  authenticationRequest(payload: string): Promise<string>;
  signatureRequest(payload: string): Promise<SignatureData>;
  getProductInfo:
    | undefined
    | (() => {
        version: string;
        name: string;
        meta?: {
          tag?: string;
          commit?: string;
          [key: string]: any;
        };
        [key: string]: any;
      });
}
```

