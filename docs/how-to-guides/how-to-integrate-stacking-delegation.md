---
title: Integrate Stacking Delegation
---

import StacksjsStartersNote from '../includes/\_stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

In this guide, you'll learn how to integrate the Stacking delegation flow by interacting with the respective smart contract, as well as reading data from the Stacks blockchain.

This guide highlights the following capabilities:

- As an account holder: delegate STX tokens
- As a delegator: Stack STX token on behalf of the account holder
- As a delegator: Commit to Stacking with all delegated STX tokens

## Prerequisites

First, you'll need to understand the [Stacking delegation mechanism](https://docs.stacks.co/understand-stacks/stacking).

You'll also need [NodeJS](https://nodejs.org/en/download/) `12.10.0` or higher to complete this tutorial. You can verify your installation by opening up your terminal and run the following command:

```sh
node --version
```

Finally, you need to have access to at least two accounts (STX account holder and delegator). For testing purposes on the testnet, you can use the CLI to generate them:

```sh
stacks make_keychain -t > account.json
stacks make_keychain -t > delegator.json
```

You can use the faucet to obtain testnet STX tokens for the test account. Replace `<stxAddress>` below with your address:

```sh
curl -XPOST "https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx?address=<stxAddress>&stacking=true"
```

## Step 1: Integrate libraries

Install the stacking, network, transactions libraries, and bn.js for large number handling:

```shell
npm install --save @stacks/stacking @stacks/network @stacks/transactions bn.js
```

:::info
See additional [Stacking library reference](https://github.com/blockstack/stacks.js/tree/master/packages/stacking)
:::

## Step 2: Delegate STX tokens

To get started, delegate STX tokens as an account holder.

```js
import { getNonce } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';
import BN from 'bn.js';

// for mainnet: const network = new StacksMainnet();
const network = new StacksTestnet();

// the stacker STX address
const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';

const client = new StackingClient(address, network);

// how much to stack, in microSTX
const amountMicroStx = new BN(100000000000);

// STX address of the delegator
const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';

// burn height at which the delegation relationship should be revoked (optional)
const untilBurnBlockHeight = 5000;

// hash of bitcoin address that the delegator has to use to receive the pool's rewards (optional)
const poxAddress = undefined;

// private key of the account holder for transaction signing
const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

const delegetateResponse = await client.delegateStx({
  amountMicroStx,
  delegateTo,
  untilBurnBlockHeight, // optional
  poxAddress, // optional
  privateKey,
});

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

This method calls the [`delegate-stx`](https://docs.stacks.co/references/stacking-contract#delegate-stx) method of the Stacking contract. Note, that the amount can be higher or lower than the current account balance. Delegation does not yet lock the STX tokens, users can still transfer them.

:::tip
To avoid handling private keys, it is recommended to use the [Stacks Wallet](https://www.hiro.so/wallet) to sign the delegation transaction
:::

**Congratulations!** With the completion of this step, you successfully learnt how to use the Stacking library to delegate STX tokens as an account holder.

## Optional: Revoke delegation rights

Delegators will be able to Stack STX tokens on the account holder's behalf until either the set burn height is reached or the account holder revokes the rights.

To revoke delegation rights, the account holder can call the `revokeDelegatestx` method.

```js
const revokeResponse = await client.revokeDelegateStx(privateKey);

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

This method calls the [`revoke-delegate-stx`](https://docs.stacks.co/references/stacking-contract#revoke-delegate-stx) method of the Stacking contract.

:::tip
To avoid handling private keys, it is recommended to use the [Stacks Wallet](https://www.hiro.so/wallet) to sign the revoke transaction
:::

## Step 3: Stack delegated STX tokens

With an established delegation relationship, the delegator can stack STX tokens on behalf of the account holder. This happens usually in a different client app than the delegation.

```js
// block height at which to stack
const burnBlockHeight = 2000;

// the delegator initiates a different client
const delegatorAddress = 'ST22X605P0QX2BJC3NXEENXDPFCNJPHE02DTX5V74';

// number cycles to stack
const cycles = 3;

// delegator private key for transaction signing
const delegatorPrivateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

// the BTC address for reward payouts; either to the delegator or to the BTC address set by the account holder
// must start with "1" or "3". Native Segwit (starts with "bc1") is not supported
const delegatorBtcAddress = 'msiYwJCvXEzjgq6hDwD9ueBka6MTfN962Z';

// if you call this method multiple times in the same block, you need to increase the nonce manually
let nonce = getNonce(delegatorAddress, network);
nonce = nonce.add(new BN(1));

const delegatorClient = new StackingClient(delegatorAddress, network);

const delegetateStackResponses = await delegatorClient.delegateStackStx({
  stacker: address,
  amountMicroStx,
  poxAddress: delegatorBtcAddress,
  burnBlockHeight,
  cycles,
  privateKey: delegatorPrivateKey,
  nonce, // optional
});

//   {
//     txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
//   }
```

This function calls the [`delegate-stack-stx`](https://docs.stacks.co/references/stacking-contract#delegate-stack-stx) method of the Stacking contract to lock up the STX token from the account holder.

The delegator must call this method multiple times (for all stackers), until enough tokens are locked up to participate in Stacking. This is the first part of delegated stacking for the delegator.

:::info
Reward slots are assigned based on the number of STX tokens locked up for a specific Bitcoin reward address
:::

## Step 4: Commit to Stacking

As soon as pooling completes (minimum STX token threshold reached), the delegator needs to confirm participation for the next one or more cycles:

```js
// reward cycle id to commit to
const rewardCycle = 12;

const delegetateCommitResponse = await delegatorClient.stackAggregationCommit({
  poxAddress: delegatorBtcAddress, // this must be the delegator bitcoin address
  rewardCycle,
  privateKey: delegatorPrivateKey,
});

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

This method calls the [`stack-aggregation-commit`](https://docs.stacks.co/references/stacking-contract#stack-aggregation-commit) function of the Stacking contract. This call also includes locked Stacks from previous cycles. This is the second part of delegated stacking for the delegator.

This method has to be called once for each reward cycle, even if all account holders have already locked their Stacks for several cycles in a row. If no new account holders are added to the pool, then this method call can be made even several cycles before the actual rewards cycle.

Locking delegated Stacks together with a aggregation commits can be done several times before the cycle starts as long as the minimum increment amount of locked Stacks is met.

**Congratulations!** With the completion of this step, you successfully learnt how to use the Stacking library to ...

- Stack STX token on behalf of an account holder
- Commit to Stacking with all delegated STX tokens
