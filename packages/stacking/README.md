# @stacks/stacking [![npm](https://img.shields.io/npm/v/@stacks/stacking?color=red)](https://www.npmjs.com/package/@stacks/stacking)

Library for PoX Stacking.

## Installation

```shell
npm install @stacks/stacking
```

## Initialization

Initialize a `StackingClient` to interact with the Stacking contract.

_Note: the `StackingClient` sets its transactions `AnchorMode` to `Any`._

```typescript
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

// for mainnet: const network = StacksMainnet;
const network = StacksTestnet;
// the stacks STX address
const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
const client = new StackingClient(address, network);
```

## Check stacking eligibility

```typescript
// a BTC address for reward payouts
const poxAddress = 'mvuYDknzDtPgGqm2GnbAbmGMLwiyW3AwFP';
// number cycles to stack
const cycles = 3;

// Refer to initialization section to create client instance
const stackingEligibility = await client.canStack({ poxAddress, cycles });

// {
//   eligible: false,
//   reason: 'ERR_STACKING_INVALID_LOCK_PERIOD',
// }
```

## Stack STX

```typescript
// a BTC address for reward payouts
const poxAddress = 'mvuYDknzDtPgGqm2GnbAbmGMLwiyW3AwFP';
// number cycles to stack
const cycles = 3;
// how much to stack, in microSTX
const amountMicroStx = 100000000000n;
// private key for transaction signing
const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
// block height at which to stack
const burnBlockHeight = 2000;

// Refer to initialization section to create client instance
const stackingResults = await client.stack({
  amountMicroStx,
  poxAddress,
  cycles,
  privateKey,
  burnBlockHeight,
});

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

## Will Stacking be executed in the next cycle?

```typescript
const stackingEnabledNextCycle = await client.isStackingEnabledNextCycle();

// true / false
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

```typescript
const hasMinStxAmount = await client.hasMinimumStx();

// true / false
```

## Get account stacking status

```typescript
const stackingStatus = await client.getStatus();

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

## Delegation

There are four methods available for delegation, two for the delegators and two for the delegatee.

### Delegatee

If you are the account owner ("stacker"), you can delegate or revoke delegation rights.

#### Delegate STX

```typescript
// STX address of the delegator
const delegateTo = 'ST2MCYPWTFMD2MGR5YY695EJG0G1R4J2BTJPRGM7H';
// burn height at which the delegation relationship should be revoked (optional)
const untilBurnBlockHeight = 5000;
// how much to stack, in microSTX
const amountMicroStx = 100000000000n;
// private key for transaction signing
const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

const delegetateResponse = await client.delegateStx({
  amountMicroStx,
  delegateTo,
  untilBurnBlockHeight, // optional
  privateKey,
});

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

#### Revoke delegation

```typescript
// private key for transaction signing
const privateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

const revokeResponse = await client.revokeDelegateStx(privateKey);

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

### Delegator

If you are the delegator, you can stack ("lock up") tokens for your users and commit to stacking participation for upcoming reward cycles.

#### Stack delegated STX

```typescript
import { getNonce } from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

// for mainnet: const network = StacksMainnet;
const network = StacksTestnet;
// the stacks STX address
const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
// delegators would initiate a different client
const delegatorAddress = 'ST22X605P0QX2BJC3NXEENXDPFCNJPHE02DTX5V74';
// delegator private key for transaction signing
const delegatorPrivateKey = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
// the BTC address for reward payouts
const delegatorBtcAddress = 'msiYwJCvXEzjgq6hDwD9ueBka6MTfN962Z';
// how much to stack, in microSTX
const amountMicroStx = 100000000000n;
// block height at which to stack
const burnBlockHeight = 2000;
// number cycles to stack
const cycles = 3;
// if you call this method multiple times in the same block, you need to increase the nonce manually
let nonce = await getNonce(delegatorAddress, network);
nonce = nonce + 1n;

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

#### Commit to stacking

```typescript
// reward cycle id to commit to
const rewardCycle = 12;
// the BTC address for reward payouts
const delegatorBtcAddress = 'msiYwJCvXEzjgq6hDwD9ueBka6MTfN962Z';
// Private key
const privateKeyDelegate = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';

const delegetateCommitResponse = await delegatorClient.stackAggregationCommit({
  poxAddress: delegatorBtcAddress,
  rewardCycle,
  privateKey: privateKeyDelegate,
});

// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
// }
```

#### Get burnchain rewards

```typescript
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
// for mainnet: const network = StacksMainnet;
const network = StacksTestnet;
const client = new StackingClient(address, network);
const options = { limit: 2, offset: 0 };

const rewards = await client.getRewardsForBtcAddress(options);
//{
//   limit: 2,
//   offset: 0,
//   results: [
//     {
//       canonical: true,
//       burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
//       burn_block_height: 2004622,
//       burn_amount: '0',
//       reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
//       reward_amount: '20000',
//       reward_index: 0
//     },
//     {
//       canonical: true,
//       burn_block_hash: '0x000000000000002f72213de621f9daf60d76aed3902a811561d06373b2fa6123',
//       burn_block_height: 2004621,
//       burn_amount: '0',
//       reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
//       reward_amount: '20000',
//       reward_index: 0
//     }
//   ]
// };
```

#### Get burnchain rewards total

```typescript
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
// for mainnet: const network = StacksMainnet;
const network = StacksTestnet;
const client = new StackingClient(address, network);

const total = await client.getRewardsTotalForBtcAddress();
//{
// reward_recipient: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
// reward_amount: '0'
//}
```

#### Get burnchain reward holders

```typescript
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import { StackingClient } from '@stacks/stacking';

const address = 'myfTfju9XSMRusaY2qTitSEMSchsWRA441';
// for mainnet: const network = StacksMainnet;
const network = StacksTestnet;
const client = new StackingClient(address, network);
const options = { limit: 2, offset: 0 };

const rewardHolders = await client.getRewardHoldersForBtcAddress(options);
// {
//   limit: 2,
//   offset: 0,
//   total: 46,
//   results: [
//     {
//       canonical: true,
//       burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
//       burn_block_height: 2004622,
//       address: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
//       slot_index: 1
//     },
//     {
//       canonical: true,
//       burn_block_hash: '0x000000000000002083ca8303a2262d09a824cecb34b78f13a04787e4f05441d3',
//       burn_block_height: 2004622,
//       address: 'myfTfju9XSMRusaY2qTitSEMSchsWRA441',
//       slot_index: 0
//     }
//   ]
// };
```
