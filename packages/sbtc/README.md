# `sbtc` 0.3.x (mainnet-pre-release)

A helper package for interacting with sBTC from JavaScript/TypeScript.

- [Installation](#installation)
- [Overview](#overview)
  - [sBTC](#sbtc)
    - [Architecture](#architecture)
    - [Deposit Flow](#deposit-flow)
    - [Withdraw Flow](#withdraw-flow)
  - [`sbtc` Package](#sbtc-package)
- [Examples](#examples)
  - [`buildSbtcDepositAddress`](#buildsbtcdepositaddress)
  - [`buildSbtcDepositTx`](#buildsbtcdeposittx)
  - [`sbtcDepositHelper`](#sbtcdeposithelper)
  - [`SbtcApiClientMainnet` / `SbtcApiClientTestnet` / `SbtcApiClientDevenv`](#sbtcapiclientmainnet--sbtcapiclienttestnet--sbtcapiclientdevenv)
- [API](#api)
  - [`sbtcDepositHelper`](#sbtcdeposithelper-1)
  - [`SbtcApiClientMainnet` / `SbtcApiClientTestnet` / `SbtcApiClientDevenv`](#sbtcapiclientmainnet--sbtcapiclienttestnet--sbtcapiclientdevenv-1)

## Installation

```bash
npm install sbtc
```

## Overview

### sBTC

#### Architecture

- **Bitcoin:** The original funds are sourced from Bitcoin. A depositor sends these funds to a group of signers, which manage a (rotating) multisignature address formatted for sBTC transactions.
- **sBTC API (Emily):** This API is responsible for tracking deposits and notifying the signers about pending deposits.
- **Stacks:** The network where sBTC is minted. Once the deposit is confirmed, the signers mint the corresponding amount of sBTC to the depositor's specified address on the Stacks network.

#### Deposit Flow

- **Create Deposit (Bitcoin) Transaction:**
  - Structure a Bitcoin transaction to send funds to the group of signers.
  - Use a specialized format that includes:
    - **Deposit Script**: Identifies which _Stacks address_ the sBTC will be minted to and what the _maximum fee_ (in satoshis) the signers may take in exchange for minting.
    - **Reclaim Script**: Allows the sender to reclaim their funds if the transaction is not processed by the signers.
- **Sign and Broadcast the Transaction:**
  - Sign the transaction with the sender’s private key.
  - Broadcast the transaction to the Bitcoin network (Bitcoin Regtest for Stacks Testnet).
- **Notify the sBTC API (Emily):**
  - Inform the API about the transaction by submitting its details.
    This step ensures that the signers are aware of the deposit and can track it.
- **Processing by Signers:** (_no action required_)
  - The signers retrieve and verify the deposit transaction from the Bitcoin blockchain.
  - Once verified, the signers mint the equivalent amount of sBTC on the Stacks network.
- **Receive sBTC (Stacks):** (_no action required_)
  - The minted sBTC is sent to the depositor's designated Stacks address, completing the deposit process.
  - sBTC is SIP-010 compatible and will show up in Stacks wallets and explorers.

#### Withdraw Flow

> _Coming soon_

---

### `sbtc` Package

The package exports high-level functions for building addresses and transactions.

**With wallets:**

- [`buildSbtcDepositAddress`](#buildsbtcdepositaddress) — build a deposit address and metadata (enough for most use-cases)
- [`buildSbtcDepositTx`](#buildsbtcdepositaddress) — build a deposit transaction and metadata

**Without wallets:**

- [`sbtcDepositHelper`](#sbtcdeposithelper) — create a fully-formed deposit transaction (assuming an address with spendable bitcoin UTXOs)

**HTTP Clients:**

Additionally, there are two API helpers, which make it easier to get all the data needed to create the above transactions:

- [`SbtcApiClientMainnet`](#sbtcapiclientmainnet-sbtcapiclienttestnet-sbtcapiclientdevenv) — a client for communicating with the different pieces of the sBTC deployment
- [`SbtcApiClientTestnet`](#sbtcapiclientmainnet-sbtcapiclienttestnet-sbtcapiclientdevenv) — a client for communicating with the different pieces of the sBTC deployment on Testnet
- [`SbtcApiClientDevenv`](#sbtcapiclientmainnet-sbtcapiclienttestnet-sbtcapiclientdevenv) — a client for developing against a [local deployment of sBTC](https://github.com/stacks-network/sbtc/blob/0ff9070ffdfde4a8c0fec025de5a182e2aedca2d/Makefile#L169-L173)

While the final adjustments are still being made in the pre-release phase, this package may change default URLs and contract addresses on every minor release.

| Version | Purpose                       | Functionality |
| ------- | ----------------------------- | ------------- |
| 0.1.x   | Developer release (hackathon) |               |
| 0.2.x   | Regtest/Testnet release       | Deposit only  |
| 0.3.x   | Mainnet pre-release           | Deposit only  |

---

## Examples

### `buildSbtcDepositAddress`

Build a deposit address and metadata to be used with any wallet.

```ts
import { buildSbtcDepositAddress, SbtcApiClientTestnet } from 'sbtc';

const client = new SbtcApiClientTestnet();

// 1. BUILD THE DEPOSIT ADDRESS AND METADATA
const deposit = buildSbtcDepositAddress({
  stacksAddress: TARGET_STX_ADDRESS,
  signersPublicKey: await client.fetchSignersPublicKey(),

  // OPTIONAL DEFAULTS
  // maxSignerFee: 80_000, // optional: fee to pay for the deposit transaction (taken from the signers from the sats)
  // reclaimLockTime: 6_000, // optional: lock time for the reclaim script
  // network: REGTEST, // optional: which bitcoin network to use
});

// `deposit.address` is the deposit address (send funds here, aka the deposit address as an output)

// 2. DEPOSIT USING YOUR FAVORITE WALLET (TYPICALLY ALSO BROADCASTED BY THE WALLET)
const txid = await WalletProvider.sendTransfer({
  recipient: deposit.address,
  amount: 100_000, // the amount to deposit; <=maxSignerFee is taken from this amount
});

// 3. NOTIFY THE SIGNERS
await client.notifySbtc({ txid, ...deposit });
```

### `buildSbtcDepositTx`

Like `buildSbtcDepositAddress`, but also builds a deposit transaction.

> **Note:** This function ONLY builds the basic format of the deposit transaction. You still need to add inputs (and potential change outputs) yourself.

```ts
import { buildSbtcDepositTx } from 'sbtc';

// 1. BUILD THE DEPOSIT TRANSACTION AND METADATA
const deposit = buildSbtcDepositTx({
  amountSats: DEPOSIT_AMOUNT, // the amount in sats/sBTC to deposit; <=maxSignerFee is taken from this amount

  // same options as `buildSbtcDepositAddress`
  network,
  stacksAddress,
  signersPublicKey,
  maxSignerFee,
  reclaimLockTime,
});

// `deposit.transaction` has one output, which is the combined taproot of the deposit and reclaim scripts

// 2. SIGN THE TRANSACTION
deposit.transaction.sign(YOUR_BTC_PRIVATE_KEY);
deposit.transaction.finalize();

// 2. OR SIGN VIA EXTERNAL WALLET
const psbtBytes = deposit.transaction.toPSBT();

// 3. BROADCAST THE TRANSACTION
const txid = await client.broadcastTx(deposit.transaction);

// 4. NOTIFY THE SIGNERS
await client.notifySbtc(deposit);
```

### `sbtcDepositHelper`

```ts
import { sbtcDepositHelper, SbtcApiClientTestnet } from 'sbtc';

const client = new SbtcApiClientTestnet();

// 1. BUILD THE DEPOSIT TRANSACTION AND METADATA (GIVEN UTXOS FOR AN ADDRESS)
const deposit = await sbtcDepositHelper({
  stacksAddress: TARGET_STX_ADDRESS, // where to send/mint the sBTC
  amountSats: 5_000_000, // (maximum) amount of sBTC to deposit

  signersPublicKey: pub, // the aggregated public key of the signers

  feeRate: await client.fetchFeeRate('medium'),
  utxos: await client.fetchUtxos(YOUR_BTC_ADDRESS),

  bitcoinChangeAddress: YOUR_BTC_ADDRESS,
});

// 2. SIGN THE TRANSACTION
deposit.transaction.sign(YOUR_BTC_PRIVATE_KEY);
deposit.transaction.finalize();

// 2. OR SIGN VIA EXTERNAL WALLET
const psbtBytes = deposit.transaction.toPSBT();

// 3. BROADCAST TRANSACTION
const txid = await client.broadcastTx(deposit.transaction);
console.log('txid', txid);

// 4. NOTIFY THE SIGNERS
const res = await client.notifySbtc(deposit);
console.log('res', res.status, res.statusMessage);
```

> **Note:** Here `SbtcApiClientTestnet` can be replaced with `SbtcApiClientDevenv` to interact with the local deployment of the sBTC contract.

### `SbtcApiClientMainnet` / `SbtcApiClientTestnet` / `SbtcApiClientDevenv`

```ts
import { SbtcApiClientMainnet, SbtcApiClientTestnet, SbtcApiClientDevenv } from 'sbtc';

const client = new SbtcApiClientMainnet();
// const client = new SbtcApiClientTestnet();
// const client = new SbtcApiClientDevenv();

const pub = await client.fetchSignersPublicKey(); // fetches the aggregated public key of the signers
const address = await client.fetchSignersAddress(); // fetches the p2tr address of the aggregated public key of the signers

const feeRate = await client.fetchFeeRate('low'); // or 'medium', 'high'
const unspents = await client.fetchUtxos(BTC_ADDRESS);
const hex = await client.fetchTxHex(TXID);

await client.broadcastTx(DEPOSIT_BTC_TX); // broadcast a deposit BTC transaction
await client.notifySbtc(DEPOSIT_BTC_TX); // notify the sBTC API about the deposit (otherwise it won't be processed)

const sbtcBalance = await client.fetchSbtcBalance(STX_ADDRESS); // fetch the sBTC balance of an Stacks address
```

## API

### `sbtcDepositHelper`

| Parameter              | Description                                                                                     | Type                 | Default                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------- |
| `signersPublicKey`     | Signers public key (aggregated schnorr)                                                         | `string` 32 byte hex | —                                                          |
| `amountSats`           | Bitcoin amount denominated in sats (\* 10^8)                                                    | `number, bigint`     | —                                                          |
| `stacksAddress`        | The deposit recipient Stacks address                                                            | `string`             | —                                                          |
| `bitcoinChangeAddress` | Bitcoin change address                                                                          | `string`             | —                                                          |
| `feeRate`              | Fee rate in sat/vbyte                                                                           | `number`             | —                                                          |
| `utxos`                | UTXOs to "fund" the transaction                                                                 | `UtxoWithTx[]`       | —                                                          |
| `reclaimPublicKey`     | Public key (schnorr, x-only) for reclaiming failed deposits                                     | `string`             | —                                                          |
|                        |                                                                                                 |                      |                                                            |
| `reclaimLockTime`      | Optional reclaim lock time                                                                      | `number`             | `144`                                                      |
| `maxSignerFee`         | Optional maximum fee to pay to signers for the sBTC mint                                        | `number`             | `80_000`                                                   |
| `network`              | Optional Bitcoin network                                                                        | `BitcoinNetwork`     | `MAINNET`                                                  |
| `utxoToSpendable`      | Optional function to convert p2wpk and p2sh utxos to spendable inputs                           | `Function`           | Best effort default implementation to make utxos spendable |
|                        |                                                                                                 |                      |                                                            |
| `paymentPublicKey`     | Optional payment public key (currently only used for default utxoToSpendable.sh implementation) | `string` hex         | —                                                          |

### `SbtcApiClientMainnet` / `SbtcApiClientTestnet` / `SbtcApiClientDevenv`

| Parameter      | Description                                       | Type     |
| -------------- | ------------------------------------------------- | -------- |
| `sbtcContract` | The multisig address of the initial sBTC contract | `string` |
| `sbtcApiUrl`   | The base URL of the sBTC API (Emily)              | `string` |
| `btcApiUrl`    | The base URL of the Bitcoin mempool/electrs API   | `string` |
| `stxApiUrl`    | The base URL of the Stacks API                    | `string` |
