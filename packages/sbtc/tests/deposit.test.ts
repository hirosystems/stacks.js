import { HDKey } from '@scure/bip32';
import * as bip39 from '@scure/bip39';
import * as btc from '@scure/btc-signer';
import { describe, expect, test } from 'vitest';
import { sbtcDepositHelper } from '../src';
import * as api from '../src/transactions/api';

describe('mock integration test', () => {
  test('deposit', async () => {
    // == Wallet ===================================================================
    const seed = await bip39.mnemonicToSeed(
      'twice kind fence tip hidden tilt action fragile skin nothing glory cousin green tomorrow spring wrist shed math olympic multiply hip blue scout claw'
    );

    const TESTNET_VERSION = {
      private: 0x00000000,
      public: 0x043587cf,
    };
    const hdkey = HDKey.fromMasterSeed(seed, TESTNET_VERSION);

    const chainCode = 1; // testnet = 1, mainnet = 0
    const accountIndex = 0;
    const path = `m/84'/${chainCode}'/${accountIndex}'/0/0`;

    const privKey = hdkey.derive(path).privateKey!;
    const address = btc.getAddress('wpkh', privKey, btc.TEST_NETWORK)!;

    // == sBTC =====================================================================

    const TARGET_STACKS_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

    // Tx building (most simple interface)
    const tx = await sbtcDepositHelper({
      stacksAddress: TARGET_STACKS_ADDRESS,
      amountSats: 1_000,

      feeRate: await api.estimateFeeRate('low'),
      utxos: await api.fetchUtxos(address),

      bitcoinChangeAddress: address,
    });

    tx.sign(privKey);
    tx.finalize();

    expect(tx).toBeDefined(); // yay, it didn't throw
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
