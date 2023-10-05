---
sidebar_label: Getting Started
---

# Getting Started with Stacks.js

import StacksjsStartersNote from '../includes/\_stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

To introduce the different functionality offered by Stacks.js, we'll walk through a few examples and concepts important to building on the Stacks blockchain.

## Networks

Typically, we speak of "mainnet" and "testnet" as the networks of Stacks. Most wallets will be configured to "mainnet" by default, this is the actual blockchain that holds real STX tokens.
As the name suggests, "testnet" is a network for testing.
It's a separate blockchain state that holds test tokens, which have no value.

Developers are encouraged to use testnet for testing before rolling out applications and contracts to mainnet.
There is even Devnet/Mocknet for working in a local development environment for development.
Stacks.js functions can be configured to use whichever network you want.

```js
import { StacksMainnet, StacksTestnet } from '@stacks/network';
const mainnet = new StacksMainnet();
const testnet = new StacksTestnet();
```

The constructors can also be passed a custom URL to an API, if you want to use a different API than the default.

```js
import { StacksMainnet } from '@stacks/network';
const network = new StacksMainnet({ url: 'https://www.mystacksnode.com/' });
```

## Accounts and Addresses

:::info Connect 🌐
For web apps, you can request the user's address via Stacks Connect. [Read more](https://connect.stacks.js.org/modules/_stacks_connect#quotconnectquot-aka-authentication-showconnect)
:::

Stacks.js uses the concept of an "account" to represent a user's identity on the blockchain. An account is identified by a unique address. The address is derived from the account's public key, which is derived from the account's private key.

A normal mainnet address starts with `SP`, and a testnet address starts with `ST`.
e.g. `SP3FGQ8Z7JY9BWYZ5WM53E0M9NK7WHJF0691NZ159`, `ST2F4BK4GZH6YFBNHYDDGN4T1RKBA7DA1BJZPJEJJ`

```js
import { generateSecretKey } from '@stacks/wallet-sdk';

const mnemonic = generateSecretKey();
// aunt birth lounge misery utility blind holiday walnut fuel make gift parent gap picnic exact various express sphere family nerve oil drill engage youth

const wallet = await generateWallet({
  secretKey: mnemonic,
  password: 'secretpassword',
});

const account = wallet.accounts[0];
const mainnetAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Mainnet });
const testnetAddress = getStxAddress({ account, transactionVersion: TransactionVersion.Testnet });
```

## Transactions

The following shows how to create a simple transaction (STX transfer) using Stacks.js in different environments.

### Using Connect 🌐

```js
import { openSTXTransfer } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import { AnchorMode } from '@stacks/transactions';

openSTXTransfer({
  network: new StacksTestnet(),

  recipient: 'ST39MJ145BR6S8C315AG2BD61SJ16E208P1FDK3AK', // which address we are sending to
  amount: 10000, // tokens, denominated in micro-STX
  anchorMode: AnchorMode.Any,

  onFinish: response => console.log(response.txid),
  onCancel: () => console.log('User canceled'),
});
```

<!-- todo -->
<!-- [Read more](./connect.md) about transaction signing with Stacks Connect. -->

### Using a private key 🔑

For full manual transaction signing, we need to provide the sender's private key.
Treat the private key as a secret and never expose it to the public!

```js
import { makeSTXTokenTransfer } from '@stacks/transactions';

const tx = await makeSTXTokenTransfer({
  recipient: 'ST39MJ145BR6S8C315AG2BD61SJ16E208P1FDK3AK', // which address we are sending to
  amount: 10000, // tokens, denominated in micro-STX
  anchorMode: 'any',
  senderKey: 'c3a2d3...0b1c2', // private key (typically derived from a mnemonic)
});
```

<!-- todo -->
<!-- [Read more](./installing.md) about transaction signing with Stacks.js. -->

## Anchor Mode / Block Type

In the examples above, we used `AnchorMode.Any` to indicate that the transaction can be "mined" in different ways.
Stacks has two types of blocks: microblocks and (anchor) blocks.

- **Microblocks** (off-chain) are faster, but less reliable. Microblocks can be confirmed quickly but are not final until the microblock is included in an anchor block.
- **Anchor Blocks** (on-chain) are the normal Stacks block. They are slower, but more reliable. Anchor blocks are final and cannot be reverted.

<!-- todo: Read more about how decentralized blocks work -->

```js
// AnchorMode options
anchorMode: "offChainOnly" | "onChainOnly" | "any",
```

## Post Conditions

In Stacks, transactions can have "post conditions".
These are additional security to ensure the transaction was executed as expected.

Post conditions can't say anything about the end-state after a transaction, but they can verify that certain things happened during the transaction.

More precisely, post conditions can verify that:

- STX tokens were transferred from an address
- FTs/NFTs we transferred from an address

:::caution
Post conditions aren't perfect and can't always guarantee the receival of FTs/NFTs, since they only check senders.
:::

An example adding a post condition (of an address sending 1000 uSTX).

```js
import { Pc } from '@stacks/transactions';

const tx = await makeContractCall({
  // ...
  postConditions: [
    Pc.principal('STB44HYPYAT2BB2QE513NSP81HTMYWBJP02HPGK6').willSendEq(1000).ustx(),
  ],
});
```

### Post Condition "Mode"

_...aka "allow transfer of unspecified assets?"_

In addition to the post conditions itself, we can also specify a "mode" for the transaction to verify asset transfers.
The mode can be either `Allow` or `Deny`.

- `Allow` means that the transaction can transfer any asset (assuming no conflicting post conditions).
- `Deny` means the transaction will fail if any asset transfers (not specified in the post conditions) are attempted.

:::note
In either case, all post conditions will still be checked.
By default, transactions are set to `Deny` mode for additional security.
:::

## Broadcasting

:::info Connect 🌐
For web apps via Stacks Connect, the users' wallet will broadcast the transaction and return a txid.
[Read more](https://connect.stacks.js.org/modules/_stacks_connect)
:::

A finalized transaction can be broadcasted to the network or serialized (to a byte representation) using Stacks.js.

```js
import { bytesToHex } from '@stacks/common';
import { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } from '@stacks/transactions';

const broadcastResponse = await broadcastTransaction(transaction);
const txId = broadcastResponse.txid;

const serializedTx = tx.serialize(); // Uint8Array
const serializedTxHex = bytesToHex(serializedTx); // hex string
```
