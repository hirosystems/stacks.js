---
title: Sign Transactions
---

import StacksjsStartersNote from '../../includes/\_stacks.js-starters-note.mdx';
import StacksProviderSection from '../../includes/\_stacks.js-provider-section.mdx';

<StacksjsStartersNote/>

This guide explains how to prompt users to sign [transactions](https://docs.stacks.co/understand-stacks/transactions) and broadcast them to the Stacks blockchain by implementing the [`connect`](https://github.com/hirosystems/connect) package of Stacks.js.

Transaction signing provides a way for users execute Clarity smart contracts that are relevant to your app then handle the result as appropriate.

Users can sign transactions that exchange fungible or non-fungible tokens with upfront guarantees that help them retain control over their digital assets.

There are three types of transactions:

1. STX transfer
2. Contract deployment
3. Contract execution

See the public registry tutorial for a concrete example of these capabilities in practice.

## Install dependency

:::tip
In order to utilize the latest transaction signing with the Stacks Wallet, use version 5 of the `@stacks/connect` NPM package.
:::

The following dependency must be installed:

```
npm install @stacks/connect
```

## Initiate session

Users must authenticate to an app before the `connect` package will work to prompt them for signing and broadcasting transactions to the Stacks blockchain with an authenticator such as [the Stacks Wallet](https://www.hiro.so/wallet/install-web).

See the authentication guide before proceeding to integrate the following transaction signing capabilities in cases where `userSession.isUserSignedIn()` returns `true`.

## Get the user's Stacks address

After your user has authenticated with their Stacks Wallet, you can get their Stacks address from their `profile`.

```ts
const profile = userSession.loadUserData().profile.stxAddress;

const mainnetAddress = stxAddresses.mainnet;
// "SP2K5SJNTB6YP3VCTCBE8G35WZBPVN6TDMDJ96QAH"
const testnetAddress = stxAddresses.testnet;
// "ST2K5SJNTB6YP3VCTCBE8G35WZBPVN6TDMFEVESR6"
```

## Prompt to transfer STX

Call the `openSTXTransfer` function provided by the `connect` package to trigger the display of a transaction signing prompt for transferring STX:

```tsx
import { openSTXTransfer } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

openSTXTransfer({
  recipient: 'ST2EB9WEQNR9P0K28D2DC352TM75YG3K0GT7V13CV',
  amount: '100',
  memo: 'Reimbursement',
  network: new StacksTestnet(), // for mainnet, `new StacksMainnet()`
  appDetails: {
    name: 'My App',
    icon: window.location.origin + '/my-app-logo.svg',
  },
  onFinish: data => {
    console.log('Stacks Transaction:', data.stacksTransaction);
    console.log('Transaction ID:', data.txId);
    console.log('Raw transaction:', data.txRaw);
  },
});
```

Several parameters are available for calling `openSTXTransfer`. Here's the exact interface for them:

```tsx
interface STXTransferOptions {
  recipient: string;
  amount: string;
  memo?: string;
  network: StacksNetwork;
  fee: number | string;
  appDetails: {
    name: string;
    icon: string;
  };
  onFinish: (data: FinishedTxData) => void;
}
```

| parameter  | type             | required | description                                                                                                                                                                                                                           |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| recipient  | string           | true     | STX address for recipient of transfer                                                                                                                                                                                                 |
| amount     | string           | true     | Amount of microstacks (1 STX = 1,000,000 microstacks) to be transferred provided as string to prevent floating point errors.                                                                                                          |
| appDetails | object           | true     | Dictionary that requires `name` and `icon` for app                                                                                                                                                                                    |
| onFinish   | function         | true     | Callback executed by app when transaction has been signed and broadcasted. [Read more](#onFinish-option)                                                                                                                              |
| memo       | string           | false    | Optional memo for inclusion with transaction                                                                                                                                                                                          |
| network    | StacksNetwork    | false    | Specify the network that this transaction should be completed on. [Read more](#network-option)                                                                                                                                        |
| fee        | number \| string | false    | Optional fee amount in microstacks (1 STX = 1,000,000 microstacks) for overwriting the wallet's default fee value. [Read more](https://forum.stacks.org/t/mempool-congestion-on-stacks-observations-and-next-steps-from-hiro/12325/5) |

## Prompt to deploy smart contract

Call the `openContractDeploy` function provided by the `connect` package to trigger the display of a transaction signing prompt for deploying a smart contract:

```tsx
import { openContractDeploy } from '@stacks/connect';

const codeBody = '(begin (print "hello, world"))';

openContractDeploy({
  contractName: 'my-contract-name',
  codeBody,
  appDetails: {
    name: 'My App',
    icon: window.location.origin + '/my-app-logo.svg',
  },
  onFinish: data => {
    console.log('Stacks Transaction:', data.stacksTransaction);
    console.log('Transaction ID:', data.txId);
    console.log('Raw transaction:', data.txRaw);
  },
});
```

Several parameters are available for calling `openContractDeploy`. Here's the exact interface for them:

```tsx
interface ContractDeployOptions {
  codeBody: string;
  contractName: string;
  network: StacksNetwork;
  fee: number | string;
  appDetails: {
    name: string;
    icon: string;
  };
  onFinish: (data: FinishedTxData) => void;
}
```

| parameter    | type             | required | description                                                                                                                                                                                                                           |
| ------------ | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| codeBody     | string           | true     | Clarity source code for contract                                                                                                                                                                                                      |
| contractName | string           | true     | Name for contract                                                                                                                                                                                                                     |
| appDetails   | object           | true     | Dictionary that requires `name` and `icon` for app                                                                                                                                                                                    |
| onFinish     | function         | true     | Callback executed by app when transaction has been signed and broadcasted. [Read more](#onFinish-option)                                                                                                                              |
| network      | StacksNetwork    | false    | Specify the network that this transaction should be completed on. [Read more](#network-option)                                                                                                                                        |
| fee          | number \| string | false    | Optional fee amount in microstacks (1 STX = 1,000,000 microstacks) for overwriting the wallet's default fee value. [Read more](https://forum.stacks.org/t/mempool-congestion-on-stacks-observations-and-next-steps-from-hiro/12325/5) |

:::info
Contracts will deploy to the Stacks address of the authenticated user.
:::

## Prompt to execute contract

Call the `openContractCall` function provided by the `connect` package to trigger the display of a transaction signing prompt for executing a contract.

As an example, consider this simple Clarity contract:

```clarity
(define-public
  (my-func
    (arg-uint uint)
    (arg-int int)
    (arg-buff (buff 20))
    (arg-string-ascii (string-ascii 20))
    (arg-string-utf8 (string-utf8 20))
    (arg-principal principal)
    (arg-bool bool)
  )
  (ok u0)
)
```

To execute this function, invoke the `openContractCall` method. Use the `ClarityValue` types from `@stacks/transactions` to construct properly formatted arguments.

```tsx
import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  intCV,
  bufferCV,
  stringAsciiCV,
  stringUtf8CV,
  standardPrincipalCV,
  trueCV,
} from '@stacks/transactions';

const functionArgs = [
  uintCV(1234),
  intCV(-234),
  bufferCV(Buffer.from('hello, world')),
  stringAsciiCV('hey-ascii'),
  stringUtf8CV('hey-utf8'),
  standardPrincipalCV('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6'),
  trueCV(),
];

const options = {
  contractAddress: 'ST22T6ZS7HVWEMZHHFK77H4GTNDTWNPQAX8WZAKHJ',
  contractName: 'my-contract',
  functionName: 'my-func',
  functionArgs,
  appDetails: {
    name: 'My App',
    icon: window.location.origin + '/my-app-logo.svg',
  },
  onFinish: data => {
    console.log('Stacks Transaction:', data.stacksTransaction);
    console.log('Transaction ID:', data.txId);
    console.log('Raw transaction:', data.txRaw);
  },
};

await openContractCall(options);
```

Several parameters are available for calling `openContractCall`. Here's the exact interface for them:

```tsx
interface ContractCallOptions {
  contractAddress: string;
  functionName: string;
  contractName: string;
  functionArgs?: ClarityValue[];
  network: StacksNetwork;
  fee: number | string;
  appDetails: {
    name: string;
    icon: string;
  };
  onFinish: (data: FinishedTxData) => void;
}
```

| parameter       | type             | required | description                                                                                                                                                                                                                           |
| --------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| contractAddress | string           | true     | Stacks address to which contract is deployed                                                                                                                                                                                          |
| contractName    | string           | true     | Name of contract to sign                                                                                                                                                                                                              |
| functionName    | string           | true     | Name of function for signing / execution, which needs to be a [public function](https://docs.stacks.co/references/language-functions#define-public).                                                                                  |
| functionArgs    | `ClarityValue[]` | true     | Arguments for calling the function. [Learn more about constructing clarity values](https://github.com/blockstack/stacks.js/tree/master/packages/transactions#constructing-clarity-values). Defaults to `[]`.                          |
| appDetails      | object           | true     | Dictionary that requires `name` and `icon` for app                                                                                                                                                                                    |
| onFinish        | function         | true     | Callback executed by app when transaction has been signed and broadcasted. [Read more](#onFinish-option)                                                                                                                              |     |
| network         | StacksNetwork    | false    | Specify the network that this transaction should be completed on. [Read more](#network-option)                                                                                                                                        |
| fee             | number \| string | false    | Optional fee amount in microstacks (1 STX = 1,000,000 microstacks) for overwriting the wallet's default fee value. [Read more](https://forum.stacks.org/t/mempool-congestion-on-stacks-observations-and-next-steps-from-hiro/12325/5) |

## Getting the signed transaction back after completion {#onFinish-option}

Each transaction signing method from `@stacks/connect` allows you to specify an `onFinish` callback. This callback will be triggered after the user has successfully broadcasted their transaction. The transaction will be broadcasted, but it will be pending until it has been mined on the Stacks blockchain.

You can access some information about this transaction via the arguments passed to `onFinish`. Your callback will be fired with a single argument, which is an object with the following properties:

```ts
interface FinishedTxData {
  stacksTransaction: StacksTransaction;
  txRaw: string;
  txId: string;
}
```

The `StacksTransaction` type comes from the [`@stacks/transactions`](https://stacks.js.org/modules/transactions.html) library.

The `txId` property can be used to provide a link to view the transaction in the explorer.

```ts
const onFinish = data => {
  const explorerTransactionUrl = 'https://explorer.stacks.co/txid/${data.txId}';
  console.log('View transaction in explorer:', explorerTransactionUrl);
};
```

## Specifying the network for a transaction {#network-option}

All of the methods included on this page accept a `network` option. By default, Connect uses a testnet network option. You can import a network configuration from the [`@stacks/network`](https://stacks.js.org/modules/network.html) package.

```ts
import { StacksTestnet, StacksMainnet } from '@stacks/network';

const testnet = new StacksTestnet();
const mainnet = new StacksMainnet();

// use this in your transaction signing methods:

openSTXTransfer({
  network: mainnet,
  // other relevant options
});
```

## Usage in React Apps

Import the `useConnect` from the [`connect-react`](https://github.com/hirosystems/connect) package to integrate transaction signing more seamlessly into React apps.

```
npm install @stacks/connect-react
```

Each transaction signing method is itself available as a function returned by `useConnect` though prefixed with `do` for consistency with React action naming standards:

- `openContractCall` as `doContractCall`
- `openSTXTransfer` as `doSTXTransfer`
- `openContractDeploy` as `doContractDeploy`

Use these functions with the same parameters as outlined above. However, you don't have to specify `appDetails` since they are detected automatically if `useConnect` has been used already [for authentication](/build-apps/authentication#usage-in-react-apps).

```tsx
import { useConnect } from '@stacks/connect-react';

const MyComponent = () => {
  const { doContractCall } = useConnect();

  const onClick = async () => {
    const options = {
      /** See examples above */
    };
    await doContractCall(options);
  };

  return <span onClick={onClick}>Call my contract</span>;
};
```

## Request testnet STX from faucet

You may find it useful to request testnet STX from [the Explorer sandbox](https://explorer.stacks.co/sandbox/deploy?chain=testnet) while developing your app with the Stacks testnet.

## Transaction request / response payload

Under the hood, `@stacks/connect` will serialize and deserialize data between your app and the Stacks Wallet.

These payloads are tokens that conform to the [JSON Web Token (JWT) standard](https://tools.ietf.org/html/rfc7519) with additional support for the `secp256k1` curve used by Bitcoin and many other cryptocurrencies.

### Transaction Request Payload

When an application triggers an transaction from `@stacks/connect`, the options of that transaction are serialized into a `transactionRequest` payload. The `transactionRequest` is similar to the [authRequest](/build-apps/authentication#authrequest-payload-schema) payload used for authentication.

The transaction request payload has the following schema, in addition to the standard JWT required fields:

```ts
interface TransactionRequest {
  appDetails?: {
    name: string;
    icon: string;
  };
  // 1 = "allow", 2 = "deny".
  postConditionMode?: PostConditionMode; // number
  // Serialized version of post conditions
  postConditions?: string[];
  // JSON serialized version of `StacksNetwork`
  // This allows the app to specify their default desired network.
  // The user may switch networks before broadcasting their transaction.
  network?: {
    coreApiUrl: string;
    chainID: ChainID; // number
  };
  // `AnchorMode` defined in `@stacks/transactions`
  anchorMode?: AnchorMode; // number
  // The desired default stacks address to sign with.
  // There is no guarantee that the transaction is signed with this address;
  stxAddress?: string;
  txType: TransactionDetails; // see below
}

export enum TransactionTypes {
  ContractCall = 'contract_call',
  ContractDeploy = 'smart_contract',
  STXTransfer = 'token_transfer',
}

interface ContractCallPayload extends TransactionRequest {
  contractAddress: string;
  contractName: string;
  functionName: string;
  // Serialized Clarity values to be used as arguments in the contract call
  functionArgs: string[];
  txType: TransactionTypes.ContractCall;
}

interface ContractDeployPayload extends TransactinRequest {
  contractName: string;
  // raw source code for this contract
  codeBody: string;
  txType: TransactionTypes.ContractDeploy;
}

interface StxTransferPayload extends TransactionRequest {
  recipient: string;
  // amount for this transaction, in microstacks
  amount: string;
  memo?: string;
  txType: TransactionTypes.STXTransfer;
}
```

### Transaction Response payload

After the user signs and broadcasts a transaction, a `transactionResponse` payload is sent back to your app.

```ts
interface TransactionResponse {
  txId: string;
  // hex serialized version of this transaction
  txRaw: string;
}
```

<StacksProviderSection/>
