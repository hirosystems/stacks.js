# @stacks/stacking [![npm](https://img.shields.io/npm/v/@stacks/stacking?color=red)](https://www.npmjs.com/package/@stacks/stacking)
Library for PoX Stacking.

## Installation

```
npm install @stacks/stacking
```

## Initialization
```typescript
const { StacksTestnet } = require('@stacks/network');
const { Stacker } = require('@stacks/stacking');

const address = 'ST3XKKN4RPV69NN1PHFDNX3TYKXT7XPC4N8KC1ARH';
const network = new StacksTestnet();
const stacker = new Stacker(address, network);
```

## Check stacking eligibility

```typescript  
const stackingEligibility = await stacker.canLockStx({poxAddress, cycles});

// stackingEligibility:
// {
//   eligible: false,
//   reason: 'ERR_STACKING_INVALID_LOCK_PERIOD',
// }
```

## Get PoX info
```typescript
const poxInfo = await stacker.getPoxInfo();

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

## Get account balance
```typescript
const responseBalanceInfo = await stacker.getAccountBalance();

// 800000000000 
```

## Stack STX
```typescript
const poxAddress = '1Xik14zRm29UsyS6DjhYg4iZeZqsDa8D3';
const amountMicroStx = new BN(100000000000);
const cycles = 10;
const key = 'd48f215481c16cbe6426f8e557df9b78895661971d71735126545abddcd5377001';
const burnBlockHeight = 2000;

const stackingResults = await stacker.lockStx({ 
  amountMicroStx,
  poxAddress,
  cycles,
  key,
  burnBlockHeight
});

// stackingResults:
// {
//   txid: '0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481',
//   transaction: 'https://testnet-explorer.now.sh/txid/0xf6e9dbf6a26c1b73a14738606cb2232375d1b440246e6bbc14a45b3a66618481'
// }
```

## Get account stacking status
```typescript
const stackingStatus = await stacker.getStatus();

// stackingStatus:
// {
//   amount_microstx: '80000000000000',
//   first_reward_cycle: 18,
//   lock_period: 10,
//   pox_address: {
//     version: '00',
//     hashbytes: '05cf52a44bf3e6829b4f8c221cc675355bf83b7d'
//   }
// }
```