import { bytesToHex } from '@stacks/common';
import { BufferCV, SomeCV } from '@stacks/transactions';
import { expect, test } from 'vitest';
import { DevEnvHelper, SBTC_FT_ADDRESS } from '../src';
import { WALLET_00, WALLET_02, getBitcoinAccount, getStacksAccount } from './helpers/wallet';

const dev = new DevEnvHelper();

test('minting bitcoin increases balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_00);

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
  const wallet = await getBitcoinAccount(WALLET_00);

  const unspent = await dev.fetchUtxos(wallet.wpkh.address);

  expect(unspent.length).toBeGreaterThan(0);
  expect(unspent[0]).toMatchObject(
    expect.objectContaining({ txid: expect.any(String), tx: expect.any(String) })
  );
});

test('get btc balance', async () => {
  const wallet = await getBitcoinAccount(WALLET_02, 2);

  const balance = await dev.getBalance(wallet.wpkh.address);
  console.log('balance', balance);

  expect(balance).toBeGreaterThan(0);
});

test('get sbtc balance', async () => {
  const wallet = await getStacksAccount(WALLET_00, 1);

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
  const pegAccount = await getBitcoinAccount(WALLET_00);
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
