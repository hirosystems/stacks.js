import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import { UTXO, buildDepositTransaction } from 'sbtc-bridge-lib';
import { expect, test } from 'vitest';
import { bytesToHex } from '../../common/src';
import { DevEnvHelper, WALLET_00, sbtcDepositHelper } from '../src';

const dev = new DevEnvHelper();

test('deposit, tx compare', async () => {
  const bitcoinAccount = await dev.getBitcoinAccount(WALLET_00);
  const stacksAccount = await dev.getStacksAccount(WALLET_00, 1);

  const utxos = await dev.fetchUtxos(bitcoinAccount.wpkh.address);

  const pegAccount = await dev.getBitcoinAccount(WALLET_00);
  const pegPublicKey = bytesToHex(pegAccount.tr.publicKey);
  const pegAddress = pegAccount.tr.address;
  // TODO: SHOULD THIS WORK INSTEAD? public key / address should be fetchable with little knowledge
  // const pegAddress = await dev.getSbtcPegAddress('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset');
  // const pegPublicKey = bytesToHex(
  //   (
  //     (await dev.stacksCallReadOnly({
  //       contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset',
  //       functionName: 'get-bitcoin-wallet-public-key',
  //     })) as any
  //   ).value.buffer
  // );

  // Tx building
  const txStacksjs = await sbtcDepositHelper({
    pegAddress, // sBTC contract emitted public key => tr btc address

    stacksAddress: stacksAccount.address,
    amountSats: 1_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos,

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  const txLib = buildDepositTransaction(
    'development',
    pegPublicKey,
    {
      amountSats: 1000,
      bitcoinAddress: bitcoinAccount.wpkh.address,
      paymentPublicKey: bytesToHex(bitcoinAccount.publicKey),
      principal: stacksAccount.address,
      reclaimPublicKey: 'NOT-USED-FOR-OP-DROP',
      sbtcWalletPublicKey: pegPublicKey,
    },
    { high_fee_per_kb: 3 * 1024, medium_fee_per_kb: 2 * 1024, low_fee_per_kb: 1 * 1024 },
    utxos as UTXO[]
  );

  // todo: fails right now (0 suffix)
  // expect(txStacksjs.getOutput(0)).toEqual(txLib.getOutput(0));
  // expect(txStacksjs.getOutput(1)).toEqual(txLib.getOutput(1));

  const hexCli =
    '010000000001010221549531adce86b1fbcc178c0535d85d90b7f521d284df018b43f5529650730000000000feffffff0300000000000000001b6a1969643c051ab3a14500ad8ac4e6d823ab20fd2c6d1369aa5bb7e8030000000000002251205e682db7c014ab76f2b4fdcbbdb76f9b8111468174cdb159df6e88fe9d078ce6eb2a50090000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e002473044022042ff63f361a5c3be42525a4dbfd8410a4d932449e6f849aebd97b3076f7b3d14022061c80cf8ecbcc2a633370e026a11ae0ad3e0be2f2838e073a15fae5a08fe48f0012103969ff3e2bf7f2f73dc903cd11442032c8c7811d57d96ce327ee89c9edea63fa899040000';
  const txCli = btc.Transaction.fromRaw(hexToBytes(hexCli), {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });

  expect(txStacksjs.getOutput(0)).toEqual(txCli.getOutput(0));
  expect(txStacksjs.getOutput(1)).toEqual(txCli.getOutput(1));
});

test('deposit, broadcast', async () => {
  const bitcoinAccount = await dev.getBitcoinAccount(WALLET_00);
  const stacksAccount = await dev.getStacksAccount(WALLET_00, 1);

  const pegAccount = await dev.getBitcoinAccount(WALLET_00);
  const pegAddress = pegAccount.tr.address;

  // Tx building
  const txStacksjs = await sbtcDepositHelper({
    pegAddress, // sBTC contract emitted public key => tr btc address

    stacksAddress: stacksAccount.address,
    amountSats: 1_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos: await dev.fetchUtxos(bitcoinAccount.wpkh.address),

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  txStacksjs.sign(bitcoinAccount.privateKey);
  txStacksjs.finalize();

  const txid = await dev.broadcastTx(txStacksjs);
  console.log('txid', txid);
});
