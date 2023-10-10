import * as btc from '@scure/btc-signer';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@stacks/common';
import { encodeMessage, hashMessage, hashSha256Sync } from '@stacks/encryption';
import { createStacksPrivateKey, signMessageHashRsv } from '@stacks/transactions';
import { getDataToSign } from 'sbtc-bridge-lib';
import { expect, test } from 'vitest';
import {
  DevEnvHelper,
  MagicBytes,
  REGTEST,
  buildSBtcWithdrawBtcPayload,
  buildSbtcWithdrawTxOpReturn,
  sbtcWithdrawHelper,
  sbtcWithdrawMessage,
} from '../src';
import { WALLET_00, WALLET_02, getBitcoinAccount, getStacksAccount } from './helpers/wallet';

const dev = new DevEnvHelper();

test('withdraw, tx compare', async () => {
  const bitcoinAccount = await getBitcoinAccount(WALLET_00, 1);
  const stacksAccount = await getStacksAccount(WALLET_00, 1);

  const pegAccount = await getBitcoinAccount(WALLET_00);
  const pegAddress = pegAccount.tr.address;

  // Tx prerequisites
  const message = sbtcWithdrawMessage({
    amountSats: 1_000,
    bitcoinAddress: bitcoinAccount.wpkh.address,
  });

  // - A browser extension could do this step
  const signature = signMessageHashRsv({
    messageHash: bytesToHex(hashMessage(message)),
    privateKey: createStacksPrivateKey(stacksAccount.stxPrivateKey),
  }).data;

  // todo: compare with sbtc-bridge-lib

  // Tx building
  const txStacksjs = await sbtcWithdrawHelper({
    network: { ...REGTEST, magicBytes: MagicBytes.Testnet }, // CLI uses TESTNET for some reason

    amountSats: 1_000,
    bitcoinAddress: bitcoinAccount.wpkh.address,
    bitcoinChangeAddress: bitcoinAccount.wpkh.address,

    signature,

    pegAddress,
    fulfillmentFeeSats: 2_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos: await dev.fetchUtxos(bitcoinAccount.wpkh.address),
  });

  txStacksjs.sign(bitcoinAccount.privateKey);
  txStacksjs.finalize();

  // CLI uses TESTNET magic bytes for some reason
  const hexCli =
    '01000000000101eab0bde2677f322225c89af3e4a457c7705e90e6265c839fe6cb1c4e9c6bc0490200000000feffffff0400000000000000004f6a4c4c54323e00000000000003e800083852dc4d33a732f009d4b89e0c77d4bff8b2ee79be58323cafa87bcb0f97e7067e703eb32e3539b374b1eb4d302791d8379067400bb072f2e05511b58a27b7260100000000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e0d0070000000000002251205e682db7c014ab76f2b4fdcbbdb76f9b8111468174cdb159df6e88fe9d078ce67d6f814a0000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e002473044022012a10a937ce3567daea29e4a5464b8553a2093a80d78418cf9240bc2c3f960be022074e97c05a722fde9eab75fe0906944a7379fee46bba565495d4bc19019a0ab39012103969ff3e2bf7f2f73dc903cd11442032c8c7811d57d96ce327ee89c9edea63fa8d4010000';
  const txCli = btc.Transaction.fromRaw(hexToBytes(hexCli), {
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });

  expect(txStacksjs.getOutput(0).script!).toEqual(txCli.getOutput(0).script!);
  expect(txStacksjs.getOutput(1).script!).toEqual(txCli.getOutput(1).script!);
  expect(txStacksjs.getOutput(2).script!).toEqual(txCli.getOutput(2).script!);

  const txid = await dev.broadcastTx(txStacksjs);
  console.log('txid', txid);
});
