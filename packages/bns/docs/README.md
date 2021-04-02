# `@stacks/bns`

A package for interacting with the [BNS contract](https://explorer.stacks.co/txid/SP000000000000000000002Q6VF78.bns?chain=mainnet)
on the Stacks blockchain.

## What is BNS?
The [Blockchain Naming System](https://docs.blockstack.org/build-apps/references/bns)
(BNS) is a network system that binds Stacks usernames to off-chain
state without relying on any central points of control.

## Installation
```
npm install --save @stacks/bns
```

## Usage

### `can-register-name`

```
import { canRegisterName } = from '@stacks/bns';
import { StacksTestnet } = from '@stacks/network';

const network = new StacksMainnet();

const result = await canRegisterName('name.id', network);
```

### `get-namespace-price`
```
import { get } = from '@stacks/bns';
import { StacksTestnet } = from '@stacks/network';

const network = new StacksMainnet();

const result = await canRegisterName('name.id', network);
```

### `get-name-price`
```
import { get } = from '@stacks/bns';
import { StacksTestnet } = from '@stacks/network';

const network = new StacksMainnet();

const result = await canRegisterName('name.id', network);
```
