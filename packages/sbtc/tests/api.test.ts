import * as btc from '@scure/btc-signer';
import { describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { REGTEST, SbtcApiClientDevenv, SbtcApiClientTestnet } from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';

const dev = new SbtcApiClientDevenv();
const tnet = new SbtcApiClientTestnet();

// enableFetchLogging();

createFetchMock(vi).enableMocks();

describe('testnet:', () => {
  test('fetch utxos', async () => {
    fetchMock.mockOnce(
      `[{"txid":"8d88c3878d172acd1fccf1763479b27d3287b67a14ef7ec5d36dc6335fd531fd","vout":1,"scriptPubKey":"00148ae4a48cb0c3b7874460a6f5287d9dd512a18246","status":{"confirmed":true,"block_height":77533,"block_hash":"35857448db9dfd9817c70e7e40eb1794853b7507893aac1703a40d1af44b2ddc","block_time":1733529658},"value":9998488}]`
    );

    const wallet = await getBitcoinAccount(WALLET_00);
    const unspent = await tnet.fetchUtxos(wallet.wpkh.address);

    expect(unspent.length).toBeGreaterThan(0);
  });

  test('fetch deposit', async () => {
    fetchMock.mockOnce(
      `{"bitcoinTxid":"a9a451fa6b0a5c387c997e4a229f1625574b56560559cd75d3c89a0c2ee302ac","bitcoinTxOutputIndex":0,"recipient":"051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce","amount":0,"lastUpdateHeight":200990,"lastUpdateBlockHash":"86fd8c3d197dd7c0214ba74938d12dc6a9b0895729f872c7fec8c67a81e56fe3","status":"pending","statusMessage":"Just received deposit","parameters":{"maxFee":80000,"lockTime":6000},"reclaimScript":"027017b2","depositScript":"1e0000000000013880051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce75204ea6e657117bc8168254b8943e55a65997c71b3994e1e2915002a9da0c22ee1eac"}`
    );

    const deposit = await tnet.fetchDeposit({
      txid: 'a9a451fa6b0a5c387c997e4a229f1625574b56560559cd75d3c89a0c2ee302ac',
      vout: 0,
    });
    expect(deposit).toEqual({
      bitcoinTxid: 'a9a451fa6b0a5c387c997e4a229f1625574b56560559cd75d3c89a0c2ee302ac',
      bitcoinTxOutputIndex: 0,
      recipient: '051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce',
      amount: 0,
      lastUpdateHeight: 200_990,
      lastUpdateBlockHash: '86fd8c3d197dd7c0214ba74938d12dc6a9b0895729f872c7fec8c67a81e56fe3',
      status: 'pending',
      statusMessage: 'Just received deposit',
      parameters: { maxFee: 80_000, lockTime: 6_000 },
      reclaimScript: '027017b2',
      depositScript:
        '1e0000000000013880051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce75204ea6e657117bc8168254b8943e55a65997c71b3994e1e2915002a9da0c22ee1eac',
    });
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
