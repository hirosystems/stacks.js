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

## Example Usage

```typescript
import { canRegisterName } from '@stacks/bns';
import { StacksTestnet } from '@stacks/network';

const network = new StacksMainnet();

const fullyQualifiedName = 'name.id';
const result = await canRegisterName({ fullyQualifiedName, network });
```

```typescript
import { buildRegisterNameTX } from '@stacks/bns';
import { StacksTestnet } from '@stacks/network';

const network = new StacksMainnet();

const name = 'name.id';
const salt =  'example-salt'
const zonefile =  'example-zonefile'
const publicKey = 'SPF0324DSC4K505TP6A8C7GAK4R95E38TGNZP7RE'

// construct an unsigned bns register-name transaction
const unsignedTX = await buildRegisterNameTX({ name, salt, zonefile, publicKey, network });
```

## Docs
[Library Reference](https://github.com/blockstack/stacks.js/blob/feat/bns-package/packages/bns/docs/modules.md)
