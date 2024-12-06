import { describe, expect, test } from 'vitest';
import { REGTEST, SbtcApiClientDevenv, SbtcApiClientTestnet } from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';
import * as btc from '@scure/btc-signer';
import { enableFetchLogging } from '../../internal/src';

const dev = new SbtcApiClientDevenv();
const tnet = new SbtcApiClientTestnet();

enableFetchLogging();

describe('testnet:', () => {
  test('fetch utxos', async () => {
    const wallet = await getBitcoinAccount(WALLET_00);
    const unspent = await tnet.fetchUtxos(wallet.wpkh.address);

    expect(unspent.length).toBeGreaterThan(0);
  });

  test('fetch deposit', async () => {
    const deposit = await tnet.fetchDeposit({
      txid: '684efcfa9ca7d447495ca00263a5c868541a236556a31973f61a83260751d912',
      vout: 0,
    });
    console.log(deposit);
  });
});

describe('devenv:', () => {
  const btcAddressDevenv = 'bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq';

  test('fetch signers info', async () => {
    const pub = await dev.fetchSignersPublicKey();
    console.log(pub);

    const address = await dev.fetchSignersAddress();
    console.log(address);
  });

  test('get signers address', () => {
    const pub = 'ae0636a3ba8c98ca311fe8856f377f86abe76788716c8fccd065d59f85483e6d';
    console.log(btc.p2tr(pub, undefined, REGTEST).address!);
  });

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
