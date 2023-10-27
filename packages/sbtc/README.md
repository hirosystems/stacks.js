# `sbtc` 0.1.x (developer-release)

A helper package for interacting with sBTC from JavaScript/TypeScript.

## Installation

```bash
npm install sbtc
```

## Basic Usage

The package exports two high-level helpers for interacting with sBTC:

- `sbtcDepositHelper` — create a deposit transaction (assuming spendable bitcoin UTXOs, and the sBTC peg address)
- `sbtcWithdrawHelper` — create a withdraw transaction (assuming spendable UTXOs, sBTC balance, a Stacks sBTC-withdraw signature via `sbtcWithdrawMessage`, and the sBTC peg address)

Additionally, there are two API helpers, which make it easier to get all the data needed to create the above transactions:

- `DevEnvHelper` — a helper for interacting with a local development environment [`sbtc/devenv`](https://github.com/stacks-network/sbtc/tree/main/devenv)
- `TestnetHelper` — a helper for interacting with the testnet deployment of the sBTC contract

### `sbtcDepositHelper`

```typescript
import { DevEnvHelper, sbtcDepositHelper } from 'sbtc';

const dev = new DevEnvHelper();

// Transaction building
const tx = await sbtcDepositHelper({
  pegAddress: await dev.getSbtcPegAddress(),

  stacksAddress: MY_STX_ADDRESS,
  amountSats: 1_000, // amount of BTC to deposit, in satoshis

  feeRate: await dev.estimateFeeRate('low'),
  utxos: await dev.fetchUtxos(MY_BTC_ADDRESS);

  bitcoinChangeAddress: MY_BTC_ADDRESS,
});

// Transaction signing and broadcasting
tx.sign(MY_BTC_PRIVATE_KEY);
tx.finalize();

const txid = await dev.broadcastTx(tx);
console.log('txid', txid)

// Or: export as PSBT for signing with a different wallet
const psbtBytes = tx.toPSBT();
```

> **Note:** Here `DevEnvHelper` can be replaced with `TestnetHelper` to interact with the testnet deployment of the sBTC contract.
