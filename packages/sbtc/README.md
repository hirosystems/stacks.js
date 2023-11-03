# `sbtc` 0.1.x (developer-release)

A helper package for interacting with sBTC from JavaScript/TypeScript.

## Installation

```bash
npm install sbtc
```

## Basic Usage

The package exports two high-level helpers for interacting with sBTC:

- [`sbtcDepositHelper`](#sbtcdeposithelper) — create a deposit transaction (assuming spendable bitcoin UTXOs, and the sBTC peg address)
- [`sbtcWithdrawHelper`](#sbtcwithdrawhelper) — create a withdraw transaction (assuming spendable UTXOs, sBTC balance, a Stacks sBTC-withdraw signature via `sbtcWithdrawMessage`, and the sBTC peg address)

Additionally, there are two API helpers, which make it easier to get all the data needed to create the above transactions:

- [`DevEnvHelper`](#devenvhelper--testnethelper) — a helper for interacting with a local development environment [`sbtc/devenv`](https://github.com/stacks-network/sbtc/tree/main/devenv)
- [`TestnetHelper`](#devenvhelper--testnethelper) — a helper for interacting with the testnet deployment of the sBTC contract

## Examples

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

### `sbtcWithdrawHelper`

```typescript
import { DevEnvHelper, sbtcWithdrawHelper, sbtcWithdrawMessage } from 'sbtc';

const dev = new DevEnvHelper();

const message = sbtcWithdrawMessage({
  amountSats: 1_000,
  bitcoinAddress: MY_BTC_ADDRESS, // withdrawl recipient
});

const signature = signMessageHashRsv({
  messageHash: bytesToHex(hashMessage(message)),
  privateKey: createStacksPrivateKey(MY_STX_PRIVATE_KEY),
}).data; // Or: sign message with a different wallet

// Tx building
const tx = await sbtcWithdrawHelper({
  pegAddress: await dev.getSbtcPegAddress(),

  amountSats: 1_000, // amount of BTC to withdraw, in satoshis
  bitcoinAddress: MY_BTC_ADDRESS, // withdrawl recipient
  signature,

  fulfillmentFeeSats: 2_000,

  feeRate: await dev.estimateFeeRate('low'),
  utxos: await dev.fetchUtxos(MY_BTC_ADDRESS),

  bitcoinChangeAddress: MY_BTC_ADDRESS,
});

// Transaction signing and broadcasting
tx.sign(MY_BTC_PRIVATE_KEY);
tx.finalize();

const txid = await dev.broadcastTx(tx);
console.log('txid', txid);

// Or: export as PSBT for signing with a different wallet
const psbtBytes = tx.toPSBT();
```

> **Note:** Here `DevEnvHelper` can be replaced with `TestnetHelper` to interact with the testnet deployment of the sBTC contract.

### `DevEnvHelper` / `TestnetHelper`

```typescript
import { DevEnvHelper, TestnetHelper } from 'sbtc';

// const test = new TestnetHelper(); // interchangeable
const dev = new DevEnvHelper();

await dev.getBitcoinAccount('secure glass …'); // The Bitcoin account for a given seed phrase
await dev.getStacksAccount('secure glass …'); // The Stacks account for a given seed phrase

await dev.getSbtcPegAddress(); // The sBTC peg address

await dev.estimateFeeRate('low'); // The estimated fee rate
await dev.fetchUtxos(MY_BTC_ADDRESS); // The spendable BTC UTXOs for a given address
await dev.fetchTxHex(TXID); // The raw BTC transaction for a given txid
await dev.broadcastTx(TX); // Broadcast a BTC transaction

await dev.getBalance(BTC_ADDRESS);
await dev.getSbtcBalance(STX_ADDRESS);

await dev.stacksCallReadOnly({
  contractAddress: '…',
  functionName: '…',
});
```
