import { expect, test } from 'vitest';
import { DevEnvHelper } from '../src';
import { WALLET_00, getBitcoinAccount, sleep } from './testHelpers';

test('minting bitcoin increases balance', async () => {
  const wallet01 = await getBitcoinAccount(WALLET_00);

  const devEnv = new DevEnvHelper();
  const balance = await devEnv.getBalance(wallet01.address);
  console.log('balance', balance);

  await devEnv.btcRpc.generatetoaddress({
    nblocks: 1,
    address: wallet01.address,
  });
  await sleep(1000);

  const balanceAfter = await devEnv.getBalance(wallet01.address);

  expect(balanceAfter).toBeGreaterThan(balance);
  console.log('balanceAfter', balanceAfter);
});

test('fetch utxos bitcoin rpc', async () => {
  const wallet01 = await getBitcoinAccount(WALLET_00);

  const devEnv = new DevEnvHelper();
  const unspent = await devEnv.fetchUtxos(wallet01.address);

  expect(unspent.length).toBeGreaterThan(0);
  expect(unspent[0]).toMatchObject(
    expect.objectContaining({ txid: expect.any(String), tx: expect.any(String) })
  );
});
