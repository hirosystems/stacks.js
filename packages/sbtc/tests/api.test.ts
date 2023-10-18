import { base58 } from '@scure/base';
import { bytesToHex } from '@stacks/common';
import { describe, expect, test } from 'vitest';
import {
  DevEnvHelper,
  SBTC_FT_ADDRESS_DEVENV,
  SBTC_PEG_ADDRESS_DEVENV,
  TestnetHelper,
  WALLET_00,
  sleep,
} from '../src';

const dev = new DevEnvHelper();
const tnet = new TestnetHelper();

describe('testnet:', () => {
  test('peg address matches', async () => {
    const address = await tnet.getSbtcPegAddress();
    expect(address).toBe('tb1pt0h3xp6pj3hpgfnyrx2s942j7uks2xtuwj9ths2hsfwr807pm4asas6uva'); // taken from: https://bridge.sbtc.tech/bridge-api/testnet/v1/sbtc/init-ui
  });

  test('fetch utxos', async () => {
    const wallet = await tnet.getBitcoinAccount(WALLET_00);
    const unspent = await tnet.fetchUtxos(wallet.wpkh.address);

    expect(unspent.length).toBeGreaterThan(0);
  });
});

describe('devenv:', () => {
  test('peg address matches', async () => {
    const address = await dev.getSbtcPegAddress();
    expect(address).toBe((await dev.getBitcoinAccount(WALLET_00)).tr.address);
    expect(address).toBe(SBTC_PEG_ADDRESS_DEVENV);
  });

  test('mint bitcoin', async () => {
    const wallet = await dev.getBitcoinAccount(WALLET_00);

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

  test('fetch utxos', async () => {
    const wallet = await dev.getBitcoinAccount(WALLET_00);

    const unspent = await dev.fetchUtxos(wallet.wpkh.address);

    expect(unspent.length).toBeGreaterThan(0);
  });

  test('get btc balance', async () => {
    const wallet = await dev.getBitcoinAccount(WALLET_00);

    const balance = await dev.getBalance(wallet.wpkh.address);
    console.log('balance', balance);

    expect(balance).toBeGreaterThan(0);
  });

  test('get sbtc balance', async () => {
    const wallet = await dev.getStacksAccount(WALLET_00);

    const balance = await dev.getSbtcBalance({
      holderAddress: wallet.address,
      sbtcContract: SBTC_FT_ADDRESS_DEVENV,
    });
    console.log('balance', balance);

    expect(balance).toBeGreaterThan(0);
  });
});

describe('both:', () => {
  test.each([dev, tnet])('fee estimate', async helper => {
    const feeRate = await helper.estimateFeeRate('high');
    expect(feeRate).toBeGreaterThan(0);
  });
});

test('bitcoin core rpc returns regtest privatekey wif in testnet format', async () => {
  const address = await dev.btcRpc.getnewaddress();
  expect(address.slice(0, 4)).toBe('bcrt'); // is regtest address

  // 80 = mainnet
  // ef = testnet
  const wif = await dev.btcRpc.dumpprivkey({ address });
  expect(bytesToHex(base58.decode(wif).slice(0, 1))).toBe('ef'); // regtest wif uses testnet prefix
});
