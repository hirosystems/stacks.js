import { base58 } from '@scure/base';
import { bytesToHex } from '@stacks/common';
import { BufferCV, SomeCV } from '@stacks/transactions';
import { expect, test } from 'vitest';
import { DevEnvHelper, SBTC_FT_ADDRESS, TestnetHelper, WALLET_00, sleep } from '../src';

const dev = new DevEnvHelper();
const tnet = new TestnetHelper();

test('minting bitcoin increases balance', async () => {
  const wallet = await dev.getBitcoinAccount(WALLET_00, 1);

  const balance = await dev.getBalance(wallet.wpkh.address);
  console.log('balance', balance);

  await dev.btcRpc.generatetoaddress({
    nblocks: 101, // more than 100 blocks, because coinbase txs mature after 100 blocks
    address: wallet.wpkh.address,
  });
  await sleep(500);

  const balanceAfter = await dev.getBalance(wallet.wpkh.address);
  console.log('balanceAfter', balanceAfter);
  expect(balanceAfter).toBeGreaterThan(balance);
});

test('devenv, fetch utxos', async () => {
  const wallet = await dev.getBitcoinAccount(WALLET_00, 1);

  const unspent = await dev.fetchUtxos(wallet.wpkh.address);

  expect(unspent.length).toBeGreaterThan(0);
});

test('testnet, fetch utxos', async () => {
  const wallet = await tnet.getBitcoinAccount(WALLET_00);

  const unspent = await tnet.fetchUtxos(wallet.wpkh.address);

  expect(unspent.length).toBeGreaterThan(0);
});

test('get btc balance', async () => {
  const wallet = await dev.getBitcoinAccount(WALLET_00, 1);

  const balance = await dev.getBalance(wallet.wpkh.address);
  console.log('balance', balance);

  expect(balance).toBeGreaterThan(0);
});

test('get sbtc balance', async () => {
  const wallet = await dev.getStacksAccount(WALLET_00, 1);

  const balance = await dev.getSbtcBalance({
    holderAddress: wallet.address,
    sbtcContract: SBTC_FT_ADDRESS,
  });
  console.log('balance', balance);

  expect(balance).toBeGreaterThan(0);
});

test('fee estimate', async () => {
  const feeRate = await dev.estimateFeeRate('high');
  console.log('feeRate', feeRate);

  expect(feeRate).toBeGreaterThan(0);
});

test('peg address compare', async () => {
  const pegAccount = await dev.getBitcoinAccount(WALLET_00);
  const pegPublicKeyA = bytesToHex(pegAccount.tr.publicKey);
  const pegAddressA = pegAccount.tr.address;

  const pegPublicKeyB = bytesToHex(
    (
      (await dev.stacksCallReadOnly({
        contractAddress: `${SBTC_FT_ADDRESS}.asset`,
        functionName: 'get-bitcoin-wallet-public-key',
      })) as SomeCV<BufferCV>
    ).value.buffer
  );
  const pegAddressB = await dev.getSbtcPegAddress(`${SBTC_FT_ADDRESS}.asset`);

  expect(pegPublicKeyA).toEqual(pegPublicKeyB);
  expect(pegAddressA).toEqual(pegAddressB);
});

test('bitcoin core rpc returns regtest privatekey wif in testnet format', async () => {
  const address = await dev.btcRpc.getnewaddress();
  expect(address.slice(0, 4)).toBe('bcrt'); // is regtest address

  // 80 = mainnet
  // ef = testnet
  const wif = await dev.btcRpc.dumpprivkey({ address });
  expect(bytesToHex(base58.decode(wif).slice(0, 1))).toBe('ef'); // regtest wif uses testnet prefix
});
