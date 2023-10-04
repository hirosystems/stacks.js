import { expect, test } from 'vitest';
import { DevEnvHelper, sbtcDepositHelper } from '../src';
import { WALLET_01, getBitcoinAccount, getStacksAccount } from './testHelpers';

const dev = new DevEnvHelper();

test('deposit', async () => {
  const bitcoinAccount = await getBitcoinAccount(WALLET_01);
  const stacksAccount = await getStacksAccount(WALLET_01);
  console.log('stacksAccount.address', stacksAccount.address);

  const balance = await dev.getBalance(bitcoinAccount.address);
  expect(balance).toBeGreaterThan(0);

  const utxos = await dev.fetchUtxos(bitcoinAccount.address);
  expect(utxos.length).toBeGreaterThan(0);

  // Tx building (most simple interface) OR more simple: remove duplicate args and assume defaults
  const tx = await sbtcDepositHelper({
    stacksAddress: stacksAccount.address,
    amountSats: 1_000,

    feeRate: await dev.estimateFeeRate('low'),
    utxos,

    bitcoinChangeAddress: bitcoinAccount.address,
  });

  tx.sign(bitcoinAccount.privateKey);
  tx.finalize();

  expect(tx).toBeDefined(); // yay, it didn't throw

  // Tx broadcasting
  const txid = await dev.broadcastTx(tx);
  expect(txid).toBeDefined();
});

// api.broadcastTx(tx);

// == Advanced =================================================================

// const PEG_PUB_KEY = (
//   await api.stacksCallReadOnly({
//     contractAddress: "ST1R1061ZT6KPJXQ7PAXPFB6ZAZ6ZWW28G8HXK9G5.romeo-bridge",
//     functionName: "get-bitcoin-wallet-public-key",
//     sender: TARGET_STACKS_ADDRESS, // not actually used in call
//   })
// ).value.buffer;
// const PEG_ADDRESS = btc.p2tr(PEG_PUB_KEY, undefined, btc.TEST_NETWORK).address;
