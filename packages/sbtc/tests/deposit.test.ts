import * as btc from '@scure/btc-signer';
import { bytesToHex, hexToBytes } from '@stacks/common';
import { enableFetchLogging } from '@stacks/internal';
import { beforeAll, beforeEach, expect, test } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';
import { MempoolApiUtxo, SbtcApiClientDevenv, sbtcDepositHelper, wrapLazyProxy } from '../src';
import { WALLET_00, getBitcoinAccount, getStacksAccount } from './helpers/wallet';
import RpcClient from '@btc-helpers/rpc';

const dev = new SbtcApiClientDevenv();

const contractAddress = 'SN3R84XZYA63QS28932XQF3G1J8R9PC3W76P9CSQS';

beforeAll(() => {
  // createFetchMock(vi).enableMocks(); // sets globalThis.fetch and globalThis.fetchMock to mocked version
});

beforeEach(() => {
  // fetchMock.resetMocks();
  enableFetchLogging();
});

test('btc tx, deposit to sbtc, broadcast', async () => {
  const btcAddressDevenv = 'bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq';
  const stacksAccount = await getStacksAccount(WALLET_00);

  // const res = await fetch('http://localhost:3010/api/bitcoind', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: `{"rpcMethod":"scantxoutset","params":["start",[{"desc":"addr(bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq)","range":10000}]],"bitcoinDUrl":"http://bitcoin:18443/"}`,
  // });
  // const json = await res.text();
  // console.log(json);

  const c = new SbtcApiClientDevenv();

  const utxosRequest = JSON.parse(
    `{"result":{"success":true,"txouts":855,"height":442,"bestblock":"2d678b58df8ece4d48a757df291b76d199377c14ffac879e34edecf9aedbcd46","unspents":[{"txid":"1d090cb3b1e3196b46f49375333f00e0371888b5d86e8726e91f09ccf3810256","vout":1,"scriptPubKey":"001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b2","desc":"addr(bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq)#sf4xyvk2","amount":0.9682,"coinbase":false,"height":423}],"total_amount":0.9682}}`
  );
  const utxosPre = utxosRequest.result.unspents as {
    txid: string;
    vout: number;
    amount: number;
    height: number;
    scriptPubKey: string;
  }[];

  const utxos = utxosPre
    .map(u => ({
      txid: u.txid,
      vout: u.vout,
      value: Math.round(u.amount * 1e8),
    }))
    .map(u => wrapLazyProxy(u, 'tx', () => c.fetchTxHex(u.txid)));

  console.log(utxos);

  // Tx building
  const { transaction: tx } = await sbtcDepositHelper({
    stacksAddress: stacksAccount.address,
    amountSats: 5_000_000,

    signersPublicKey: await dev.fetchSignersPublicKey(contractAddress),

    feeRate: await dev.fetchFeeRate('low'),
    utxos,

    bitcoinChangeAddress: btcAddressDevenv,
  });
  console.log(tx);

  // todo: once leather works
  // // Instead we could PSBT and sign via extension wallet
  // tx.sign(bitcoinAccount.privateKey);
  // tx.finalize();

  // const txid = await dev.broadcastTx(tx);
  // console.log('txid', txid);
});

test('sbtc info', async () => {
  const address = await dev.fetchSignersAddress();
  console.log(address);

  const pub = await dev.fetchSignersPublicKey();
  console.log(pub);

  const stacksAccount = await getStacksAccount(WALLET_00);
  console.log(stacksAccount.address);
});

// generated with the bridge
// btc tx 0200000001e450fb7b009a6e239099c2fc83ce887097b4aa2f60e9dd51f6f70f566acfe7040000000000ffffffff02c0c62d00000000002251209954c9dbd02d550c595d973bfe7aa717ce7749207b69c0e25dcf729f7866e0f6c0e1c6050000000016001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b200000000

test('btc tx, deposit to sbtc, tx compare', async () => {
  // Tx building

  // const res = await fetch('http://localhost:3010/api/bitcoind', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: `{"rpcMethod":"scantxoutset","params":["start",[{"desc":"addr(bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq)","range":10000}]],"bitcoinDUrl":"http://bitcoin:18443/"}`,
  // });
  // const json = await res.text();
  // console.log(json);

  const utxosRequest = JSON.parse(
    `{"result":{"success":true,"txouts":855,"height":442,"bestblock":"2d678b58df8ece4d48a757df291b76d199377c14ffac879e34edecf9aedbcd46","unspents":[{"txid":"1d090cb3b1e3196b46f49375333f00e0371888b5d86e8726e91f09ccf3810256","vout":1,"scriptPubKey":"001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b2","desc":"addr(bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq)#sf4xyvk2","amount":0.9682,"coinbase":false,"height":423,"tx":"020000000195d850c68941c18cd57218d828e74c1b5aa198e8c63ce5115f417ab08cfa0c990100000000ffffffff02204e00000000000022512089d656f598e0b6923d086daccd110c2a4f46596484460dcdf6ed2c87930cf6b0205bc5050000000016001447cf9cb3a2f3f9e99345fbe8a71edc8ea08cb5b200000000"}],"total_amount":0.9682}}`
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

  console.log(utxos);

  // Tx building
  const {
    transaction: tx,
    depositScript,
    reclaimScript,
  } = await sbtcDepositHelper({
    stacksAddress: 'STGSJA8EMYDBAJDX6Z4ED8CWW071B6NB97SRAM1E',
    amountSats: 20042,

    maxFee: 20000,
    reclaimLockTime: 50,

    signersPublicKey: '14c515722f2b61f9bc8bfbcd48422988533007602c74f3145616817f27302237',

    feeRate: 1,
    utxos,

    bitcoinChangeAddress: 'bcrt1qgl8eevaz70u7ny69l052w8ku36sgeddjjcawwq',
  });
  console.log(tx);

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
  console.log('tx    (0)', tx.getOutput(0));
  console.log('txCli (0)', txCli.getOutput(0));
  expect(tx.getOutput(0)).toEqual(txCli.getOutput(0));

  // change output
  expect(tx.getOutput(1).amount).toBeGreaterThan(1_000_000);
  // expect(tx.getOutput(1)).toEqual(txCli.getOutput(1)); // we don't care about change
});
