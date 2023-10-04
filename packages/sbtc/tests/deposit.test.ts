import { describe, expect, test } from 'vitest';
import { DevEnvHelper, sbtcDepositHelper } from '../src';
import { WALLET_00, getBitcoinAccount } from './testHelpers';

describe('mock integration test', () => {
  const dev = new DevEnvHelper();

  test('deposit', async () => {
    const wallet01 = await getBitcoinAccount(WALLET_00);
    const targetStacksAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    const balance = await dev.getBalance(wallet01.address);
    expect(balance).toBeGreaterThan(0);

    const utxos = await dev.fetchUtxos(wallet01.address);
    expect(utxos.length).toBeGreaterThan(0);

    // Tx building (most simple interface) OR more simple: remove duplicate args and assume defaults
    const tx = await sbtcDepositHelper({
      stacksAddress: targetStacksAddress,
      amountSats: 1_000,

      feeRate: await dev.estimateFeeRate('low'),
      utxos,

      bitcoinChangeAddress: wallet01.address,
    });

    tx.sign(wallet01.privateKey);
    tx.finalize();

    expect(tx).toBeDefined(); // yay, it didn't throw

    // Tx broadcasting
    const txid = await dev.broadcastTx(tx);
    expect(txid).toBeDefined();
  });
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
