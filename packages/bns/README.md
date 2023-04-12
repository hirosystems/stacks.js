# `@stacks/bns`

A package for interacting with the [BNS contract](https://explorer.hiro.so/txid/SP000000000000000000002Q6VF78.bns?chain=mainnet)
on the Stacks blockchain.

## What is BNS?

The [Blockchain Naming System](https://docs.stacks.co/docs/stacks-academy/bns)
(BNS) is a network system that binds Stacks usernames to off-chain
state without relying on any central points of control.

## Installation

```
npm install --save @stacks/bns
```

## Example Usages

### Check availability

Check if name can be registered

```typescript
import { canRegisterName } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';

const result = await canRegisterName({ fullyQualifiedName, network });
// true / false
```

### Get name price

Get price of name registration in microstacks

```typescript
import { getNamePrice } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';

const price = await getNamePrice({ fullyQualifiedName, network });
// price of name registration in microstacks
```

### Steps to register name

Send two transaction to secure a name, preorder and then register.

1. Preorder: Generates a name preorder transaction. First step in registering a name. This transaction does not reveal the name that is about to be registered. And it sets the amount of STX to be burned for the registration.
2. Register: Generates a name transfer transaction. This changes the owner of the registered name.

### Preorder

```typescript
import { buildPreorderNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
const salt = 'salt';
const stxToBurn = 200n;
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns priorder-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildPreorderNameTx({
  fullyQualifiedName,
  salt,
  stxToBurn,
  publicKey,
  network,
});

// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(signer.transaction, network);
// reply.txid
// Wait for the transaction to be confirmed before sending register transaction
```

### Register

```typescript
import { buildRegisterNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const zonefile = 'zonefile';
const salt = 'salt';
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns register-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildRegisterNameTx({
  fullyQualifiedName,
  publicKey,
  salt,
  zonefile,
  network,
});
// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(
  signer.transaction,
  network,
  Buffer.from(zonefile)
);
// reply.txid
```

### Transfer name

Transfer the ownership to other address

```typescript
import { buildTransferNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
const newOwnerAddress = 'ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const zonefile = 'zonefile';
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns transfer-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildTransferNameTx({
  fullyQualifiedName,
  newOwnerAddress,
  publicKey,
  zonefile,
  network,
});

// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(
  signer.transaction,
  network,
  Buffer.from(zonefile)
);
// reply.txid
```

### Update name

Generates a name update transaction. This changes the zonefile for the registered name.

```typescript
import { buildUpdateNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const zonefile = 'zonefile';
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns update-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildUpdateNameTx({
  fullyQualifiedName,
  zonefile,
  publicKey,
  network,
});
// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(
  signer.transaction,
  network,
  Buffer.from(zonefile)
);
// reply.txid
```

### Renew name

Generates a name renew transaction. This renews a name registration.

```typescript
import { buildRenewNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
const stxToBurn = 10n;
const newOwnerAddress = 'ST1HB1T8WRNBYB0Y3T7WXZS38NKKPTBR3EG9EPJKR';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const zonefile = 'zonefile';
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns renew-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildRenewNameTx({
  fullyQualifiedName,
  stxToBurn,
  newOwnerAddress,
  zonefile,
  publicKey,
  network,
});

// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(
  signer.transaction,
  network,
  Buffer.from(zonefile)
);
// reply.txid
```

### Revoke name

Generates a name revoke transaction. This revokes a name registration.

```typescript
import { buildRevokeNameTx } from '@stacks/bns';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import {
  TxBroadcastResult,
  broadcastTransaction,
  publicKeyToString,
  TransactionSigner,
  createStacksPrivateKey,
  pubKeyfromPrivKey,
} from '@stacks/transactions';

// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const fullyQualifiedName = 'name.id';
// warning: Do not expose your private key by hard coding in code. Use env variables to load private keys.
const privateKey = '<insert private key here>'; // process.env.privateKey
const publicKey = publicKeyToString(pubKeyfromPrivKey(privateKey));

// construct an unsigned bns revoke-name transaction
// note: builder functions build transactions with AnchorMode set to Any
const unsignedTX = await buildRevokeNameTx({
  fullyQualifiedName,
  publicKey,
  network,
});
// Sign the transaction with private key and broadcast to the network
const signer = new TransactionSigner(unsignedTX);
signer.signOrigin(createStacksPrivateKey(privateKey));

const reply: TxBroadcastResult = await broadcastTransaction(signer.transaction, network);
// reply.txid
```
