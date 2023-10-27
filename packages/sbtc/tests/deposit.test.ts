import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import { expect, test } from 'vitest';
import { DevEnvHelper, WALLET_00, sbtcDepositHelper } from '../src';

const dev = new DevEnvHelper();

test('btc tx, deposit to sbtc, broadcast', async () => {
  const bitcoinAccount = await dev.getBitcoinAccount(WALLET_00);
  const stacksAccount = await dev.getStacksAccount(WALLET_00);

  // Tx building
  const txStacksjs = await sbtcDepositHelper({
    pegAddress: await dev.getSbtcPegAddress(),

    stacksAddress: stacksAccount.address,
    amountSats: 1_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos: await dev.fetchUtxos(bitcoinAccount.wpkh.address),

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  // Instead we could PSBT and sign via extension wallet
  txStacksjs.sign(bitcoinAccount.privateKey);
  txStacksjs.finalize();

  const txid = await dev.broadcastTx(txStacksjs);
  console.log('txid', txid);
});

test('btc tx, deposit to sbtc, tx compare', async () => {
  const bitcoinAccount = await dev.getBitcoinAccount(WALLET_00, 1);
  const stacksAccount = await dev.getStacksAccount(WALLET_00, 1);

  // Tx building
  const txStacksjs = await sbtcDepositHelper({
    pegAddress: await dev.getSbtcPegAddress(),

    stacksAddress: stacksAccount.address,
    amountSats: 1_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos: await dev.fetchUtxos(bitcoinAccount.wpkh.address),

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  // generated with ./utils/deposit.sh (set to amount=1000)
  const hexCli =
    '0100000000010101717cad71b870970c55e7fa9fdc5ddf09fa928e33bd6b0b10d32d0e3d1c80e10000000000feffffff0300000000000000001b6a1969643c051ab3a14500ad8ac4e6d823ab20fd2c6d1369aa5bb7e8030000000000002251205e682db7c014ab76f2b4fdcbbdb76f9b8111468174cdb159df6e88fe9d078ce6db77814a0000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e00247304402205a43e26a8f372bc97c7c44b045effd23eaaf2a747c0a237082f0505e752dd32f02201610945844e438b4a27c08149d04be3dce544d9318c280f7405ae0e56a2e24e0012103969ff3e2bf7f2f73dc903cd11442032c8c7811d57d96ce327ee89c9edea63fa8d5010000';
  const txCli = btc.Transaction.fromRaw(hexToBytes(hexCli), {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });

  expect(txStacksjs.getOutput(0)).toEqual(txCli.getOutput(0));
  expect(txStacksjs.getOutput(1)).toEqual(txCli.getOutput(1));
  expect(txStacksjs.outputsLength).toEqual(txCli.outputsLength);
});
