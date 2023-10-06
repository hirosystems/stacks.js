import { expect, test } from 'vitest';
import { DevEnvHelper } from '../src';
import { WALLET_01, getBitcoinAccount } from './testHelpers';

const dev = new DevEnvHelper();

test('minting bitcoin increases balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const balance = await dev.getBalance(wallet.wpkh.address);
  console.log('balance', balance);

  await dev.btcRpc.generatetoaddress({
    nblocks: 101, // more than 100 blocks, because coinbase txs mature after 100 blocks
    address: wallet.wpkh.address,
  });

  const balanceAfter = await dev.getBalance(wallet.wpkh.address);
  expect(balanceAfter).toBeGreaterThan(balance);
  console.log('balanceAfter', balanceAfter);
});

test('fetch utxos', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const unspent = await dev.fetchUtxos(wallet.wpkh.address);

  expect(unspent.length).toBeGreaterThan(0);
  expect(unspent[0]).toMatchObject(
    expect.objectContaining({ txid: expect.any(String), tx: expect.any(String) })
  );
});

test('get balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const balance = await dev.getBalance(wallet.wpkh.address);
  console.log('balance', balance);

  expect(balance).toBeGreaterThan(0);
});

test('fee estimate', async () => {
  const feeRate = await dev.estimateFeeRate('high');
  console.log('feeRate', feeRate);

  expect(feeRate).toBeGreaterThan(0);
});
