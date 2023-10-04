import { expect, test } from 'vitest';
import { DevEnvHelper } from '../src';
import { WALLET_01, getBitcoinAccount } from './testHelpers';

const dev = new DevEnvHelper();

test('minting bitcoin increases balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const balance = await dev.getBalance(wallet.address);

  await dev.btcRpc.generatetoaddress({
    nblocks: 101, // more than 100 blocks, because coinbase txs mature after 100 blocks
    address: wallet.address,
  });

  const balanceAfter = await dev.getBalance(wallet.address);
  expect(balanceAfter).toBeGreaterThan(balance);
});

test('fetch utxos', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const unspent = await dev.fetchUtxos(wallet.address);

  expect(unspent.length).toBeGreaterThan(0);
  expect(unspent[0]).toMatchObject(
    expect.objectContaining({ txid: expect.any(String), tx: expect.any(String) })
  );
});

test('get balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_01);

  const balance = await dev.getBalance(wallet.address);
  console.log('balance', balance);

  expect(balance).toBeGreaterThan(0);
});
