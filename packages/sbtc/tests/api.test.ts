import { describe, expect, test } from 'vitest';
import { DevEnvHelper } from '../src';
import { WALLET_00, getBitcoinAccount } from './testHelpers';

describe('api tests', () => {
  test('fetch utxos bitcoin rpc', async () => {
    const devEnv = new DevEnvHelper();
    const unspent = await devEnv.fetchUtxos('mqVnk6NPRdhntvfm4hh9vvjiRkFDUuSYsH');

    expect(unspent.length).toBeGreaterThan(0);
    expect(unspent[0]).toMatchObject(
      expect.objectContaining({ txid: expect.any(String), hex: expect.any(String) })
    );
  });
});

test('minting bitcoin increases balance', async () => {
  const wallet01 = getBitcoinAccount(WALLET_00);

  const devEnv = new DevEnvHelper();
  const balance = await devEnv.getBalance(wallet01.address);

  await devEnv.btcRpc.generatetoaddress({
    nblocks: 1,
    address: wallet01.address,
  });

  const balanceAfter = await devEnv.getBalance(wallet01.address);

  expect(balanceAfter).toBeGreaterThan(balance);
});
