---
title: Integrating Stacking
---

import StacksjsStartersNote from '../../includes/\_stacks.js-starters-note.mdx';

<StacksjsStartersNote/>

In this tutorial, you'll learn how to integrate Stacking by interacting with the respective smart contract, as well as reading data from the Stacks blockchain.

This tutorial highlights the following capabilities:

- Generate Stacks accounts
- Display stacking info
- Verify stacking eligibility
- Add stacking action
- Display stacking status

:::tip
Alternatively to integration using JS libraries, you can use the [Rust CLI](https://gist.github.com/kantai/c261ca04114231f0f6a7ce34f0d2499b) or [JS CLI](/tutorials/stacking-using-cli).
:::

## Prerequisites

First, you'll need to understand the [Stacking mechanism](https://docs.stacks.co/understand-stacks/stacking).

You'll also need [NodeJS](https://nodejs.org/en/download/) `12.10.0` or higher to complete this tutorial. You can verify your installation by opening up your terminal and run the following command:

```bash
node --version
```

## Overview

In this tutorial, we'll implement the Stacking flow laid out in the [Stacking guide](https://docs.stacks.co/understand-stacks/stacking#stacking-flow).

## Step 1: Integrate libraries

Install the stacking, network, transactions libraries and bn.js for large number handling:

```shell
npm install --save @stacks/stacking @stacks/network @stacks/transactions bn.js
```

:::info
See additional [Stacking library reference](https://github.com/blockstack/stacks.js/tree/master/packages/stacking)
:::

## Step 2: Generating an account and initialization

To get started, let's create a new, random Stacks 2.0 account:

```js
import {
  makeRandomPrivKey,
  privateKeyToString,
  getAddressFromPrivateKey,
  TransactionVersion,
} from '@stacks/transactions';

import { StackingClient } from '@stacks/stacking';

import { StacksTestnet, StacksMainnet } from '@stacks/network';

import BN from 'bn.js';

// generate random key or use an existing key
const privateKey = privateKeyToString(makeRandomPrivKey());

// get Stacks address
// for mainnet, remove the TransactionVersion
const stxAddress = getAddressFromPrivateKey(privateKey, TransactionVersion.Testnet);

// instantiate the Stacker class for testnet
// for mainnet, use `new StacksMainnet()`
const client = new StackingClient(stxAddress, new StacksTestnet());
```

:::info
Review the [accounts guide](https://docs.stacks.co/understand-stacks/accounts) for more details
:::

## Step 3: Display stacking info

In order to inform users about the upcoming reward cycle, we can use the following methods to obtain information for Stacking:

With the obtained PoX info, you can present whether Stacking has been executed in the next cycle, when the next cycle begins, the duration of a cycle, and the minimum microstacks required to participate:

```js
// will Stacking be executed in the next cycle?
const stackingEnabledNextCycle = await client.isStackingEnabledNextCycle();
// true or false

// how long (in seconds) is a Stacking cycle?
const cycleDuration = await client.getCycleDuration();
// 120

// how much time is left (in seconds) until the next cycle begins?
const secondsUntilNextCycle = await client.getSecondsUntilNextCycle();
// 600000
```

:::note
Cycle duration and participation thresholds will differ between mainnet and testnet
:::

You can also retrieve the raw PoX and core information using the methods below if required:

```js
const poxInfo = await client.getPoxInfo();

// poxInfo:
// {
//   contract_id: 'ST000000000000000000002AMW42H.pox',
//   first_burnchain_block_height: 0,
//   min_amount_ustx: 83335083333333,
//   prepare_cycle_length: 30,
//   rejection_fraction: 3333333333333333,
//   reward_cycle_id: 17,
//   reward_cycle_length: 120,
//   rejection_votes_left_required: 0,
//   total_liquid_supply_ustx: 40000840000000000
// }

const coreInfo = await client.getCoreInfo();

// coreInfo:
// {
//   peer_version: 385875968,
//   pox_consensus: 'bb88a6e6e65fa7c974d3f6e91a941d05cc3dff8e',
//   burn_block_height: 2133,
//   stable_pox_consensus: '2284451c3e623237def1f8caed1c11fa46b6f0cc',
//   stable_burn_block_height: 2132,
//   server_version: 'blockstack-core 0.0.1 => 23.0.0.0 (HEAD:a4deb7a+, release build, linux [x86_64])',
//   network_id: 2147483648,
//   parent_network_id: 3669344250,
//   stacks_tip_height: 1797,
//   stacks_tip: '016df36c6a154cb6114c469a28cc0ce8b415a7af0527f13f15e66e27aa480f94',
//   stacks_tip_consensus_hash: 'bb88a6e6e65fa7c974d3f6e91a941d05cc3dff8e',
//   unanchored_tip: '6b93d2c62fc07cf44302d4928211944d2debf476e5c71fb725fb298a037323cc',
//   exit_at_block_height: null
// }

const targetBlocktime = await client.getTargetBlockTime();

// targetBlocktime:
// 120
```

Users need to have sufficient Stacks (STX) tokens to participate in Stacking. This can be verified easily:

```js
const hasMinStxAmount = await client.hasMinimumStx();
// true or false
```

For testing purposes, you can use the faucet to obtain testnet STX tokens. Replace `<stxAddress>` below with your address:

```shell
curl -XPOST "https://stacks-node-api.testnet.stacks.co/extended/v1/faucets/stx?address=<stxAddress>&stacking=true"
```

You'll have to wait a few minutes for the transaction to complete.

Users can select how many cycles they would like to participate in. To help with that decision, the unlocking time can be estimated:

```js
// this would be provided by the user
let numberOfCycles = 3;

// the projected datetime for the unlocking of tokens
const unlockingAt = new Date(new Date().getTime() + secondsUntilNextCycle);
unlockingAt.setSeconds(unlockingAt.getSeconds() + cycleDuration * numberOfCycles);
```

## Step 4: Verify stacking eligibility

At this point, your app shows Stacking details. If Stacking will be executed and the user has enough funds, the user should be asked to provide input for the amount of microstacks to lockup and a Bitcoin address to receive the pay out rewards.

With this input, and the data from previous steps, we can determine the eligibility for the next reward cycle:

```js
// user supplied parameters
// BTC address must start with "1" or "3". Native Segwit (starts with "bc1") is not supported
let btcAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
let numberOfCycles = 3;

const stackingEligibility = await client.canStack({
  poxAddress: btcAddress,
  cycles: numberOfCycles,
});

// stackingEligibility:
// {
//   eligible: false,
//   reason: 'ERR_STACKING_INVALID_LOCK_PERIOD',
// }
```

:::note
The eligibility check assumes the user will be stacking the maximum balance available in the account. The eligibility check is a read-only function call to the PoX smart contract which does not require broadcasting a transaction
:::

If the user is eligible, the stacking action should be enabled on the UI. If not, the respective error message should be shown to the user.

## Step 5: Lock STX to stack

Next, the Stacking action should be executed.

```js
// set the amount to lock in microstacks
const amountMicroStx = new BN(100000000000);

// set the burnchain (BTC) block for stacking lock to start
// you can find the current burnchain block height from coreInfo above
// and adding 3 blocks to provide a buffer for transaction to confirm
const burnBlockHeight = 2133 + 3;

// execute the stacking action by signing and broadcasting a transaction to the network
client
  .stack({
    amountMicroStx,
    poxAddress: btcAddress,
    cycles: numberOfCycles,
    privateKey,
    burnBlockHeight,
  })
  .then(response => {
    // If successful, stackingResults will contain the txid for the Stacking transaction
    // otherwise an error will be returned
    if (response.hasOwnProperty('error')) {
      console.log(response.error);
      throw new Error('Stacking transaction failed');
    } else {
      console.log(`txid: ${response}`);
      // txid: f6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481
      return response;
    }
  });
```

The transaction completion will take several minutes. Only one stacking transaction from each account/address is active at any time. Multiple/concurrent stacking actions from the same account will fail.

## Step 6: Confirm lock-up

The new transaction will not be completed immediately. It'll stay in the `pending` status for a few minutes. We need to poll the status and wait until the transaction status changes to `success`. We can use the [Stacks Blockchain API client library](/get-started/stacks-blockchain-api#javascript-client-library) to check transaction status.

```js
const { TransactionsApi } = require('@stacks/blockchain-api-client');
const tx = new TransactionsApi(apiConfig);

const waitForTransactionSuccess = txId =>
  new Promise((resolve, reject) => {
    const pollingInterval = 3000;
    const intervalID = setInterval(async () => {
      const resp = await tx.getTransactionById({ txId });
      if (resp.tx_status === 'success') {
        // stop polling
        clearInterval(intervalID);
        // update UI to display stacking status
        return resolve(resp);
      }
    }, pollingInterval);
  });

// note: txId should be defined previously
const resp = await waitForTransactionSuccess(txId);
```

:::info
More details on the lifecycle of transactions can be found in the [transactions guide](https://docs.stacks.co/understand-stacks/transactions#lifecycle)
:::

Alternatively to the polling, the Stacks Blockchain API client library offers WebSockets. WebSockets can be used to subscribe to specific updates, like transaction status changes. Here is an example:

```js
const client = await connectWebSocketClient('ws://stacks-node-api.blockstack.org/');

// note: txId should be defined previously
const sub = await client.subscribeAddressTransactions(txId, event => {
  console.log(event);
  // update UI to display stacking status
});

await sub.unsubscribe();
```

## Step 6: Display Stacking status

With the completed transactions, Stacks tokens are locked up for the lockup duration. During that time, your app can display the following details: unlocking time, amount of Stacks locked, and bitcoin address used for rewards.

```js
const stackingStatus = await client.getStatus();

// If stacking is active for the account, you will receive the stacking details
// otherwise an error will be thrown
// stackingStatus:
// {
//   stacked: true,
//   details: {
//     amount_microstx: '80000000000000',
//     first_reward_cycle: 18,
//     lock_period: 10,
//     burnchain_unlock_height: 3020,
//     pox_address: {
//       version: '00',
//       hashbytes: '05cf52a44bf3e6829b4f8c221cc675355bf83b7d'
//     }
//   }
// }
```

:::note
The `pox_address` property is the PoX contract's internal representation of the reward BTC address.
:::

To display the unlocking time, you need to use the `firstRewardCycle` and the `lockPeriod` fields.

**Congratulations!** With the completion of this step, you successfully learnt how to ...

- Generate Stacks accounts
- Display stacking info
- Verify stacking eligibility
- Add stacking action
- Display stacking status

## Optional: Rewards

Currently, the Stacking library does not provide methods to get the paid rewards for a set address. However, the [Stacks Blockchain API exposes endpoints](https://docs.hiro.so/api#tag/Burnchain) to get more details.

As an example, if you want to get the rewards paid to `btcAddress`, you can make the following API call:

```shell
# for mainnet, replace `testnet` with `mainnet`
curl 'https://stacks-node-api.testnet.stacks.co/extended/v1/burnchain/rewards/<btcAddress>'
```
