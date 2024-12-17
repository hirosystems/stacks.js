import * as btc from '@scure/btc-signer';
import { bytesToHex, hexToBytes, isInstance } from '@stacks/common';
import { describe, expect, test, vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { enableFetchLogging } from '@stacks/internal';
import {
  DEFAULT_UTXO_TO_SPENDABLE,
  REGTEST,
  SbtcApiClientDevenv,
  SbtcApiClientTestnet,
  TESTNET,
  VSIZE_INPUT_P2WPKH,
  buildSbtcReclaimTx,
  dustMinimum,
  paymentInfo,
  sbtcDepositHelper,
} from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';
import { hex } from '@scure/base';
import * as P from 'micro-packed';
import { STACKS_TESTNET } from '@stacks/network';

// enableFetchLogging(); // enable if you want to record requests to network.txt file

// set globalThis.fetch and globalThis.fetchMock to mocked version
createFetchMock(vi).enableMocks();

describe('deposit devenv', () => {
  test('btc tx, broadcast — raw fetch', async () => {
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

  test('btc tx, broadcast — client proxy', async () => {
    // TEST CASE
    // Assumes a manually funded signers address and WALLET_00 wpkh address

    const bitcoinAccount = await getBitcoinAccount(WALLET_00); // wpkh bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47 (manually funded on devenv via bridge)
    const stacksAccount = await getStacksAccount(WALLET_00);

    const dev = new SbtcApiClientDevenv();

    fetchMock.mockResponse(
      `{"okay":true,"result":"0x020000002103b6ad657d5428873633f6c3c948b4102bd697c1c8449425c1be1ff71992f98b74"}`
    );

    const pub = await dev.fetchSignersPublicKey();
    expect(pub).toBe('f1934e22bddf0dff972cf91404ab0d1cb9d4797e07c310d47283b9100d762937');

    const signerAddress = await dev.fetchSignersAddress();
    expect(signerAddress).toBe('bcrt1p5yupkjf2k8fk0unqfz9l40putap6ls9satez6a86hgdryfz4zvwqv9jal3');

    const utxos = await dev.fetchUtxos(bitcoinAccount.wpkh.address);
    expect(utxos.length).toBeGreaterThan(0);

    const utxosSigner = await dev.fetchUtxos(signerAddress);
    expect(utxosSigner.length).toBeGreaterThan(0);

    expect(await utxos[0].tx).toBeInstanceOf(String);

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
});

describe('deposit testnet', () => {
  test('btc tx, broadcast — client proxy', async () => {
    // TEST CASE
    // Assumes a manually funded WALLET_00 wpkh address

    const bitcoinAccount = await getBitcoinAccount(WALLET_00); // wpkh bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47 (manually funded on devenv via bridge)
    const stacksAccount = await getStacksAccount(WALLET_00);

    const tnet = new SbtcApiClientTestnet();

    fetchMock.mockResponse(
      `{"okay":true,"result":"0x0200000021024ea6e657117bc8168254b8943e55a65997c71b3994e1e2915002a9da0c22ee1e"}`
    );
    const pub = await tnet.fetchSignersPublicKey();
    expect(pub).toBe('4ea6e657117bc8168254b8943e55a65997c71b3994e1e2915002a9da0c22ee1e');

    const signerAddress = await tnet.fetchSignersAddress();
    expect(signerAddress).toBe('bcrt1p534swhsspmeepqu8gcg9ehu95ny74kch6rlu4er3zml0saxds0cqwpn73n');

    fetchMock.mockOnce(
      `[{"txid":"5a4968eb88da4a62aca8cbae6d9d29cd91ba30d5cca843072f3023186aab5dae","vout":1,"scriptPubKey":"00148ae4a48cb0c3b7874460a6f5287d9dd512a18246","status":{"confirmed":true,"block_height":77518,"block_hash":"6e9934b83908e999f22dd651b3d77df7315d4f079846ddc8adb7d844325d180f","block_time":1733529138},"value":14998677}]`
    );
    const utxos = await tnet.fetchUtxos(bitcoinAccount.wpkh.address);
    expect(utxos.length).toBeGreaterThan(0);

    fetchMock.mockOnce(
      `[{"txid":"68f0a31be2d80c52599cbc0b88d07b4e1ca1d749daebaedbb06bdecbd7afbce0","vout":0,"scriptPubKey":"5120a46b075e100ef390838746105cdf85a4c9eadb17d0ffcae47116fef874cd83f0","status":{"confirmed":true,"block_height":77308,"block_hash":"6e9934b83908e999f22dd651b3d77df7315d4f079846ddc8adb7d844325d180f","block_time":1733529139},"value":225673939}]`
    );
    const utxosSigner = await tnet.fetchUtxos(signerAddress);
    expect(utxosSigner.length).toBeGreaterThan(0);

    fetchMock.mockOnce(
      `0200000001ac02e32e0c9ac8d375cd590556564b5725169f224a7e997c385c0a6bfa51a4a90100000000ffffffff02404b4c00000000002251203a1a17c591190f4cd7a3b59320fb5ef8f05b4b9058e113074efae0ebbe4df22f95dce400000000001600148ae4a48cb0c3b7874460a6f5287d9dd512a1824600000000`
    );
    expect(await utxos[0].tx).toBeTypeOf('string'); // full tx hexes can be fetched

    // Tx building
    const {
      transaction: tx,
      depositScript,
      reclaimScript,
    } = await sbtcDepositHelper({
      stacksAddress: stacksAccount.address + '.contract-address',
      amountSats: 5_000_000,

      signersPublicKey: pub,

      feeRate: 1,
      utxos,

      bitcoinChangeAddress: bitcoinAccount.wpkh.address,
    });

    const psbt = tx.toPSBT();

    // @ts-ignore
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
    const txPsbt = btc.Transaction.fromPSBT(psbt);
    const json = JSON.stringify(txPsbt, null, 2);

    function parseScript(bytes: Uint8Array) {
      return btc.Script.decode(bytes).map(i => (isInstance(i, Uint8Array) ? hex.encode(i) : i));
    }

    const script = parseScript(txPsbt.getOutput(0).script!);
    console.log(script);

    console.log(json);

    tx.sign(bitcoinAccount.privateKey);
    tx.finalize();

    fetchMock.mockOnce(`"8d88c3878d172acd1fccf1763479b27d3287b67a14ef7ec5d36dc6335fd531fd"`);
    const txid = await tnet.broadcastTx(tx);

    fetchMock.mockOnce(
      `{"bitcoinTxid":"8d88c3878d172acd1fccf1763479b27d3287b67a14ef7ec5d36dc6335fd531fd","bitcoinTxOutputIndex":0,"recipient":"051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce","amount":0,"lastUpdateHeight":201059,"lastUpdateBlockHash":"083222f99686f9bd63859e2af6497df020fdb0eca9609ed41d82a9bdb1b31254","status":"pending","statusMessage":"Just received deposit","parameters":{"maxFee":80000,"lockTime":6000},"reclaimScript":"027017b2","depositScript":"1e0000000000013880051a6d78de7b0625dfbfc16c3a8a5735f6dc3dc3f2ce75204ea6e657117bc8168254b8943e55a65997c71b3994e1e2915002a9da0c22ee1eac"}`
    );

    const notify = await tnet.notifySbtc({ txid, depositScript, reclaimScript });
    expect(notify.status).toBe('pending');
    expect(notify.depositScript).toBe(depositScript);
    expect(notify.reclaimScript).toBe(reclaimScript);
  });

  test('send funds to address (stacks testnet btc regtest)', async () => {
    const priv = 'bfbd81098fcabdd0904f1d7ed1fc5db6123341ac166a61c24d115bfb665c6ba5';
    const address = btc.getAddress('wpkh', hexToBytes(priv), REGTEST)!;
    const recipient = 'bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47';
    const feeRate = 1;
    const amount = 4539558n;

    const tnet = new SbtcApiClientTestnet();
    const utxos = (await tnet.fetchUtxos(address)).sort(
      (a, b) => (a.status?.block_height ?? 0) - (b.status?.block_height ?? 0)
    );

    const tx = new btc.Transaction();
    tx.addOutputAddress(recipient, amount, REGTEST);

    const pay = await paymentInfo({
      tx,
      feeRate,
      utxos,
      utxoToSpendable: DEFAULT_UTXO_TO_SPENDABLE,
    });

    for (const input of pay.inputs) tx.addInput(input);

    const changeAfterAdditionalOutput =
      pay.changeSats - BigInt(Math.ceil(VSIZE_INPUT_P2WPKH * feeRate));
    if (changeAfterAdditionalOutput > dustMinimum(VSIZE_INPUT_P2WPKH, feeRate)) {
      tx.addOutputAddress(address, changeAfterAdditionalOutput, REGTEST);
    }

    tx.sign(hexToBytes(priv));
    tx.finalize();

    console.log('tx', tx.hex);
    const txid = await tnet.broadcastTx(tx);
    console.log('txid', txid);
  });

  test('btc tx, deposit to wrong signers, reclaim', async () => {
    const bitcoinAccount = await getBitcoinAccount(WALLET_00, 0, REGTEST); // wpkh bcrt1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxfrjz47 (manually funded on devenv via bridge)
    const stacksAccount = await getStacksAccount(WALLET_00, 0, STACKS_TESTNET);

    const tnet = new SbtcApiClientTestnet();

    fetchMock.mockOnce(
      `[{"txid":"b9f6fe6021ba347454902b1b9796e73882ebdf336675be3f08da895d48ab7a48","vout":1,"scriptPubKey":"00148ae4a48cb0c3b7874460a6f5287d9dd512a18246","status":{"confirmed":true,"block_height":80168,"block_hash":"49b7a5b26fca06dc42bb36f1c5db51bac2ff89640a686ed322b1c3d4b0537e9f","block_time":1734123925},"value":4456642}]`
    );

    const utxos = (await tnet.fetchUtxos(bitcoinAccount.wpkh.address))
      .filter(u => u.status?.block_height ?? 0 > 80168 - 100)
      .sort((a, b) => (a.status?.block_height ?? 0) - (b.status?.block_height ?? 0));

    fetchMock.mockOnce(
      `0200000001df18462593a0c582bc7bddbed0b25cba5fb0a37b57b408b6f8ff74d55810df5d0100000000ffffffff024a4e0000000000002251202a7e0f8616c84cb643587c7b0650b30b438c6f258885319a93bb70cc8aae5618c2004400000000001600148ae4a48cb0c3b7874460a6f5287d9dd512a1824600000000`
    );

    const deposit = await sbtcDepositHelper({
      network: REGTEST,

      stacksAddress: stacksAccount.address + '.contract-address',
      amountSats: 20_042,

      maxSignerFee: 20_000,
      reclaimLockTime: 3,
      reclaimPublicKey: bytesToHex(bitcoinAccount.publicKey).slice(2),

      signersPublicKey: '14c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237',
      bitcoinChangeAddress: bitcoinAccount.wpkh.address,

      feeRate: 1,
      utxos,
    });

    deposit.transaction.sign(bitcoinAccount.privateKey);
    deposit.transaction.finalize();

    fetchMock.mockOnce(`"250a95549f6bd2066a6eb25370f8856029d9be11db0ef6eddedeea7bc2d223ad"`);

    const txid = await tnet.broadcastTx(deposit.transaction);

    const reclaimTx = buildSbtcReclaimTx({
      network: REGTEST,

      amountSats: 20_042,
      bitcoinAddress: bitcoinAccount.wpkh.address,
      stacksAddress: stacksAccount.address + '.contract-address',
      signersPublicKey: '14c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237',
      maxSignerFee: 20_000,
      reclaimLockTime: 3,
      reclaimPublicKey: bytesToHex(bitcoinAccount.publicKey).slice(2),
      txid,
      feeRate: 1,
    });
    reclaimTx.sign(bitcoinAccount.privateKey);
    reclaimTx.finalize();

    fetchMock.mockOnce(`"48c06d251235e9ce96c0c7c507772b11e688bb55f9d411d87f089bf0a25b0401"`);

    await tnet.broadcastTx(reclaimTx);
  });
});

test('btc tx — compare to cli', async () => {
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