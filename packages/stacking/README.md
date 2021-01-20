# @stacks/stacking [![npm](https://img.shields.io/npm/v/@stacks/stacking?color=red)](https://www.npmjs.com/package/@stacks/stacking)

Library for PoX Stacking.

## Installation

```
npm install @stacks/stacking
```

## Initialization

```typescript
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
// for mainnet, use `StacksMainnet()`
const network = new StacksTestnet();
const stacker = new Stacker(address, network);
```

## Check stacking eligibility

```typescript
const stackingEligibility = await client.canStack({ poxAddress, cycles });

// stackingEligibility:
// {
//   eligible: false,
//   reason: 'ERR_STACKING_INVALID_LOCK_PERIOD',
// }
```

## Stack STX

```typescript
const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
const amountMicroStx = new BN(100000000000);
const cycles = 10;
const key = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
const burnBlockHeight = 2000;

const stackingResults = await client.stack({
  amountMicroStx,
  poxAddress,
  cycles,
  key,
  burnBlockHeight,
});

// stackingResults:
// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

## Will Stacking be executed in the next cycle?

```typescript
const stackingEnabledNextCycle = await client.isStackingEnabledNextCycle();

// true or false
```

## How long (in seconds) is a Stacking cycle?

```typescript
const cycleDuration = await client.getCycleDuration();

// 120
```

## How much time is left (in seconds) until the next cycle begins?

```typescript
const secondsUntilNextCycle = await client.getSecondsUntilNextCycle();

// 600000
```

## Get PoX info

```typescript
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
```

## Get Stacks node info

```typescript
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
```

## Get account balance

```typescript
const responseBalanceInfo = await client.getAccountBalance();

// 800000000000
```

## Does account have sufficient STX to meet minimum threshold?

```js
const hasMinStxAmount = await client.hasMinimumStx();

// true or false
```

## Get account stacking status

```typescript
const stackingStatus = await client.getStatus();

stackingStatus:
// {
//   stacked: true,
//   details: {
//     amount_microstx: '80000000000000',
//     first_reward_cycle: 18,
//     lock_period: 10,
//     unlock_height: 3020,
//     pox_address: {
//       version: '00',
//       hashbytes: '05cf52a44bf3e6829b4f8c221cc675355bf83b7d'
//     }
//   }
// }
```
