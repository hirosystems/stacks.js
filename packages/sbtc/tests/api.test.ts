import { describe, expect, test } from 'vitest';
import { SbtcApiClientDevenv, SbtcApiClientTestnet } from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';

const dev = new SbtcApiClientDevenv();
const tnet = new SbtcApiClientTestnet();

describe('testnet:', () => {
  test('fetch utxos', async () => {
    const wallet = await getBitcoinAccount(WALLET_00);
    const unspent = await tnet.fetchUtxos(wallet.wpkh.address);

    expect(unspent.length).toBeGreaterThan(0);
  });
});

describe('devenv:', () => {
  const btcAddressDevenv = 'bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq';

  test('fetch utxos', async () => {
    const unspent = await dev.fetchUtxos(btcAddressDevenv);
    expect(unspent.length).toBeGreaterThan(0);
  });

  test('get btc balance', async () => {
    const wallet = await getBitcoinAccount(WALLET_00);

    const balance = await dev.fetchBalance(wallet.wpkh.address);
    console.log('balance', balance);

    expect(balance).toBeGreaterThan(0);
  });

  test('get sbtc balance', async () => {
    const wallet = await getStacksAccount(WALLET_00);

    const balance = await dev.fetchSbtcBalance(wallet.address);
    console.log('balance', balance);

    expect(balance).toBeGreaterThan(0);
  });
});

describe('both:', () => {
  test.each([dev, tnet])('fee estimate', async helper => {
    const feeRate = await helper.fetchFeeRate('high');
    expect(feeRate).toBeGreaterThan(0);
  });
});
