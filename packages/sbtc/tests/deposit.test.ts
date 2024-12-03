import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import { enableFetchLogging, waitForFulfilled } from '@stacks/internal';
import { expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { SbtcApiClientDevenv, sbtcDepositHelper } from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';
import RpcClient from '@btc-helpers/rpc';

enableFetchLogging(); // enable if you want to record requests to network.txt file

// set globalThis.fetch and globalThis.fetchMock to mocked version
// createFetchMock(vi).enableMocks();

test('fetch signer address', async () => {
  const dev = new SbtcApiClientDevenv();

  await waitForFulfilled(function sbtcIsDeployed() {
    return dev.fetchSignersPublicKey();
  });

  const address = await dev.fetchSignersAddress();
  console.log('address', address);

  const bitcoinAccount = await getBitcoinAccount(WALLET_00);

  const rpc = new RpcClient('http://devnet:devnet@127.0.0.1:18443').Typed;

  let res = await rpc.generatetoaddress({ nblocks: 1, address });
  console.log('res', res);

  res = await rpc.generatetoaddress({ nblocks: 1, address: bitcoinAccount.wpkh.address });
  console.log('res', res);
});

test('btc tx, deposit to sbtc, broadcast — raw fetch', async () => {
  // TEST CASE
  // Assumes a manually funded signers address and WALLET_00 wpkh address

  const bitcoinAccount = await getBitcoinAccount(WALLET_00); // wpkh bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47 (manually funded on devenv via bridge)
  const stacksAccount = await getStacksAccount(WALLET_00);

  fetchMock.mockOnce(
    `{"result":{"success":true,"txouts":342,"height":252,"bestblock":"71903ce6738b723dad54e3ad110b859e8c1bd6ba499d94b4b0b22a44b0c10b37","unspents":[{"txid":"51349ba2a37959a5d84826311a556cf5201aeae6ddeb94b8d254976d0d20c217","vout":0,"scriptPubKey":"00148ae4a48cb0c3b7874460a6f5287d9dd512a18246","desc":"addr(bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47)#gcletckr","amount":1,"coinbase":false,"height":241}],"total_amount":1}}`
  );

  const resScantxoutset = await fetch('http://localhost:3010/api/bitcoind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: `{"rpcMethod":"scantxoutset","params":["start",[{"desc":"addr(${bitcoinAccount.wpkh.address})","range":10000}]],"bitcoinDUrl":"http://bitcoin:18443/"}`,
  });
  const jsonUtxo = await resScantxoutset.json();

  fetchMock.mockOnce(
    `{"result":"020000000150a4f0768a8ec85e76c8c049dd1839b2a6c8f35d79a5f0e0c1b23ed398cf8240000000006b4830450221008f19e4bc403136bad26e757647ccb45d8d0fc8d572da0adecd92194319be6e39022018830d39aabfbb76c037d450609466ae01d2e9a98167866d26379ce5cbf41a340121035379aa40c02890d253cfa577964116eb5295570ae9f7287cbae5f2585f5b2c7cffffffff0200e1f505000000001600148ae4a48cb0c3b7874460a6f5287d9dd512a18246e0c20f24010000001976a9141dc27eba0247f8cc9575e7d45e50a0bc7e72427d88ac00000000"}`
  );

  const txHexResponse = await fetch('http://localhost:3010/api/bitcoind', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rpcMethod: 'getrawtransaction',
      params: [jsonUtxo.result.unspents[0].txid],
      bitcoinDUrl: 'http://bitcoin:18443/',
    }),
  });
  const jsonTx = await txHexResponse.json();

  // single utxo
  const unspents = [{ ...jsonUtxo.result.unspents[0], tx: jsonTx.result }] as {
    txid: string;
    vout: number;
    amount: number;
    height: number;
    scriptPubKey: string;
    tx: string;
  }[];

  // ensure correct object format
  const utxos = unspents.map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: Math.floor(u.amount * 1e8),
    tx: u.tx,
  }));

  const dev = new SbtcApiClientDevenv();

  fetchMock.mockResponse(
    `{"okay":true,"result":"0x020000002103b6ad657d5428873633f6c3c948b4102bd697c1c8449425c1be1ff71992f98b74"}`
  );

  const pub = await dev.fetchSignersPublicKey();
  expect(pub).toBe('b6ad657d5428873633f6c3c948b4102bd697c1c8449425c1be1ff71992f98b74');

  const signerAddress = await dev.fetchSignersAddress();
  expect(signerAddress).toBe('bcrt1paeulen354qzsstck3es7ur4c27ls5kyq8myvts7zmkyp4m6972kqwanet5');

  // Tx building
  const {
    transaction: tx,
    depositScript,
    reclaimScript,
  } = await sbtcDepositHelper({
    stacksAddress: stacksAccount.address,
    amountSats: 5_000_000,

    signersPublicKey: pub,

    feeRate: 1,
    utxos,

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  tx.sign(bitcoinAccount.privateKey);
  tx.finalize();

  fetchMock.mockOnce(
    `{"result":[{"txid":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005","wtxid":"0f8ce4916f6550f8af6de05bf2e8066a090694ff65cf5ba4f3a574c457a797b8","allowed":true,"vsize":153,"fees":{"base":0.00000189,"effective-feerate":0.00001235,"effective-includes":["0f8ce4916f6550f8af6de05bf2e8066a090694ff65cf5ba4f3a574c457a797b8"]}}]}`
  );

  const resTestmempoolaccept = await fetch('http://localhost:3010/api/bitcoind', {
    body: `{"rpcMethod":"testmempoolaccept","params":[["${tx.hex}"]],"bitcoinDUrl":"http://bitcoin:18443/"}`,
    method: 'POST',
  });
  const jsonTestmempoolaccept = await resTestmempoolaccept.json();
  expect(jsonTestmempoolaccept.result[0].txid).toBe(tx.id);

  fetchMock.mockOnce(
    `{"result":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005"}`
  );

  const resBroadcast = await fetch('http://localhost:3010/api/bitcoind', {
    body: `{"rpcMethod":"sendrawtransaction","params":["${tx.hex}"],"bitcoinDUrl":"http://bitcoin:18443/"}`,
    method: 'POST',
  });
  const jsonBroadcast = (await resBroadcast.json()) as { result: string };

  fetchMock.mockOnce(
    `{"bitcoinTxid":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005","bitcoinTxOutputIndex":0,"recipient":"051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce","amount":0,"lastUpdateHeight":137,"lastUpdateBlockHash":"aa92e5d8af05a266e98ac9ed8bc1979029adaff556b8ca33ca6b216458a3a22c","status":"pending","statusMessage":"Just received deposit","parameters":{"maxFee":80000,"lockTime":6000},"reclaimScript":"027017b2","depositScript":"1e0000000000013880051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce7520b6ad657d5428873633f6c3c948b4102bd697c1c8449425c1be1ff71992f98b74ac"}`
  );

  const resEmilyDeposit = await fetch('http://localhost:3010/api/emilyDeposit', {
    body: `{"bitcoinTxid":"${jsonBroadcast.result}","bitcoinTxOutputIndex":0,"reclaimScript":"${reclaimScript}","depositScript":"${depositScript}","url":"http://emily-server:3031"}`,
    method: 'POST',
  });
  const jsonEmilyDeposit = await resEmilyDeposit.json();
  expect(jsonEmilyDeposit.status).toBe('pending');
  expect(jsonEmilyDeposit.depositScript).toBe(depositScript);
  expect(jsonEmilyDeposit.reclaimScript).toBe(reclaimScript);
});

test('btc tx, deposit to sbtc, broadcast — client proxy', async () => {
  // TEST CASE
  // Assumes a manually funded signers address and WALLET_00 wpkh address

  const bitcoinAccount = await getBitcoinAccount(WALLET_00); // wpkh bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47 (manually funded on devenv via bridge)
  const stacksAccount = await getStacksAccount(WALLET_00);

  const dev = new SbtcApiClientDevenv({
    btcApiUrl: 'http://localhost:3010/api/proxy',
  });

  const pub = await dev.fetchSignersPublicKey();
  expect(pub).toBe('f1934e22bddf0dff972cf91404ab0d1cb9d4797e07c310d47283b9100d762937');

  const signerAddress = await dev.fetchSignersAddress();
  expect(signerAddress).toBe('bcrt1p5yupkjf2k8fk0unqfz9l40putap6ls9satez6a86hgdryfz4zvwqv9jal3');

  const utxos = await dev.fetchUtxos(bitcoinAccount.wpkh.address);
  expect(utxos.length).toBeGreaterThan(0);

  const utxosSigner = await dev.fetchUtxos(signerAddress);
  expect(utxosSigner.length).toBeGreaterThan(0);

  expect(await utxos[0].tx).toBeInstanceOf(String);
  return;

  // Tx building
  const {
    transaction: tx,
    depositScript,
    reclaimScript,
  } = await sbtcDepositHelper({
    stacksAddress: stacksAccount.address,
    amountSats: 5_000_000,

    signersPublicKey: pub,

    feeRate: 1,
    utxos,

    bitcoinChangeAddress: bitcoinAccount.wpkh.address,
  });

  tx.sign(bitcoinAccount.privateKey);
  tx.finalize();

  fetchMock.mockOnce(
    `{"result":[{"txid":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005","wtxid":"0f8ce4916f6550f8af6de05bf2e8066a090694ff65cf5ba4f3a574c457a797b8","allowed":true,"vsize":153,"fees":{"base":0.00000189,"effective-feerate":0.00001235,"effective-includes":["0f8ce4916f6550f8af6de05bf2e8066a090694ff65cf5ba4f3a574c457a797b8"]}}]}`
  );

  const resTestmempoolaccept = await fetch('http://localhost:3010/api/bitcoind', {
    body: `{"rpcMethod":"testmempoolaccept","params":[["${tx.hex}"]],"bitcoinDUrl":"http://bitcoin:18443/"}`,
    method: 'POST',
  });
  const jsonTestmempoolaccept = await resTestmempoolaccept.json();
  expect(jsonTestmempoolaccept.result[0].txid).toBe(tx.id);

  fetchMock.mockOnce(
    `{"result":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005"}`
  );

  const resBroadcast = await fetch('http://localhost:3010/api/bitcoind', {
    body: `{"rpcMethod":"sendrawtransaction","params":["${tx.hex}"],"bitcoinDUrl":"http://bitcoin:18443/"}`,
    method: 'POST',
  });
  const jsonBroadcast = (await resBroadcast.json()) as { result: string };

  fetchMock.mockOnce(
    `{"bitcoinTxid":"3cc72977efc12ceeddaf5589e53cb67525e798e0c67018eeffdc1c583e9c6005","bitcoinTxOutputIndex":0,"recipient":"051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce","amount":0,"lastUpdateHeight":137,"lastUpdateBlockHash":"aa92e5d8af05a266e98ac9ed8bc1979029adaff556b8ca33ca6b216458a3a22c","status":"pending","statusMessage":"Just received deposit","parameters":{"maxFee":80000,"lockTime":6000},"reclaimScript":"027017b2","depositScript":"1e0000000000013880051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce7520b6ad657d5428873633f6c3c948b4102bd697c1c8449425c1be1ff71992f98b74ac"}`
  );

  const resEmilyDeposit = await fetch('http://localhost:3010/api/emilyDeposit', {
    body: `{"bitcoinTxid":"${jsonBroadcast.result}","bitcoinTxOutputIndex":0,"reclaimScript":"${reclaimScript}","depositScript":"${depositScript}","url":"http://emily-server:3031"}`,
    method: 'POST',
  });
  const jsonEmilyDeposit = await resEmilyDeposit.json();
  expect(jsonEmilyDeposit.status).toBe('pending');
  expect(jsonEmilyDeposit.depositScript).toBe(depositScript);
  expect(jsonEmilyDeposit.reclaimScript).toBe(reclaimScript);
});

test('btc tx, deposit to sbtc, tx compare to cli', async () => {
  // TEST CASE
  // Compares a JS generated transactions outputs to a test vector created with the CLI

  // unspents
  const utxosRequest = JSON.parse(
    `{"result":{"success":true,"txouts":517,"height":315,"bestblock":"1baa0a69cc82b2c93db9c44c27e9ec2c70326819fe0249a5524f9f505aaed6c8","unspents":[{"txid":"048661a0335d2d2f031817b1794e560a2aed11e4fc291ff0859f64d363f23676","vout":1,"scriptPubKey":"001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b2","desc":"addr(bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq)#sf4xyvk2","amount":0.9692,"coinbase":false,"height":309,"tx":"0200000001e450fb7b009a6e239099c2fc83ce887097b4aa2f60e9dd51f6f70f566acfe7040000000000ffffffff02c0c62d0000000000225120ddc5a4b2bbe1708cc983f4f28560c9e0a15440471f3c9f64f37b35584b2a9ce7c0e1c6050000000016001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b200000000"}],"total_amount":0.9692}}`
  );
  const utxosRaw = utxosRequest.result.unspents as {
    txid: string;
    vout: number;
    amount: number;
    height: number;
    scriptPubKey: string;
    tx: string;
  }[];

  const utxos = utxosRaw.map(u => ({
    txid: u.txid,
    vout: u.vout,
    value: Math.round(u.amount * 1e8),
    tx: u.tx,
  }));

  // Tx building
  const {
    transaction: tx,
    depositScript,
    reclaimScript,
  } = await sbtcDepositHelper({
    stacksAddress: 'STGSJA8EMYDBAJDX6Z4ED8CWW071B6NB97SRAM1E',
    amountSats: 20_042,

    maxSignerFee: 20_000,
    reclaimLockTime: 50,

    signersPublicKey: '14c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237',

    feeRate: 1,
    utxos,

    bitcoinChangeAddress: 'bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq', // devenv
  });

  // Test vector created with CLI in sbtc repo:
  // cargo run -p signer --bin demo-cli deposit --amount 42 --max-fee 20000 --lock-time 50 --stacks-addr STGSJA8EMYDBAJDX6Z4ED8CWW071B6NB97SRAM1E --signer-key 14c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237`

  // deposit script: "1e0000000000004e20051a2199290ea79ab549bd37c8e6a19ce00e159aab49752014c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237ac"
  // reclaim script: "0132b2"
  // Signed transaction: "02000000000101f73f625a29bc8f2dccbbc93ea3038546595de71217d9e31dd8cdd9e39f00970d000000000000000000024a4e0000000000002251208a8ec821941873b50143143f2cac95b7355979bbf75ab948f5ee2742bf1523ba1daa029500000000160014ec69329c9831f38b0a50746e53b31ad9a1b690b4024730440220119e0ec42bbf2bc7ece892929210b534de6331b27b7c94b6d77802b35fb974f7022025d077df8561ac0d949df1b6f7ee1af2075108dacc1659fa13aefb1f6ffe6dcf012102ddb1eddf71e71e6c757ecbdf6fa91aff4215f76cd2aff6a08d248ffac724269300000000"
  // Transaction sent: calculated txid 956867ecb25f4623617c0cdb58801faf8a9e18b9f16afae069544eed1e552867, actual txid 956867ecb25f4623617c0cdb58801faf8a9e18b9f16afae069544eed1e552867
  // Deposit request created: Deposit { amount: 0, bitcoin_tx_output_index: 0, bitcoin_txid: "956867ecb25f4623617c0cdb58801faf8a9e18b9f16afae069544eed1e552867", deposit_script: "1e0000000000004e20051a2199290ea79ab549bd37c8e6a19ce00e159aab49752014c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237ac", fulfillment: None, last_update_block_hash: "c97e12e335b4debc49b7f6fb14592dd151a0edc4f1d3d3745e80ae72e04edb22", last_update_height: 602, parameters: DepositParameters { lock_time: 50, max_fee: 20000 }, recipient: "051a2199290ea79ab549bd37c8e6a19ce00e159aab49", reclaim_script: "0132b2", status: Pending, status_message: "Just received deposit" }

  const depositCli =
    '1e0000000000004e20051a2199290ea79ab549bd37c8e6a19ce00e159aab49752014c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237ac';
  const reclaimCli = '0132b2';

  expect(depositScript).toEqual(depositCli);
  expect(reclaimScript).toEqual(reclaimCli);

  const txHexCli =
    '02000000000101f73f625a29bc8f2dccbbc93ea3038546595de71217d9e31dd8cdd9e39f00970d000000000000000000024a4e0000000000002251208a8ec821941873b50143143f2cac95b7355979bbf75ab948f5ee2742bf1523ba1daa029500000000160014ec69329c9831f38b0a50746e53b31ad9a1b690b4024730440220119e0ec42bbf2bc7ece892929210b534de6331b27b7c94b6d77802b35fb974f7022025d077df8561ac0d949df1b6f7ee1af2075108dacc1659fa13aefb1f6ffe6dcf012102ddb1eddf71e71e6c757ecbdf6fa91aff4215f76cd2aff6a08d248ffac724269300000000';
  const txCli = btc.Transaction.fromRaw(hexToBytes(txHexCli));

  // deposit output
  expect(tx.getOutput(0).amount).toEqual(20_042n);
  expect(tx.getOutput(0)).toEqual(txCli.getOutput(0));

  // change output
  expect(tx.getOutput(1).amount).toBeGreaterThan(1_000_000);
  // expect(tx.getOutput(1)).toEqual(txCli.getOutput(1)); // we don't care about change
});
