// import * as btc from '@scure/btc-signer';
// import { bytesToHex, hexToBytes } from '@stacks/common';
// import { hashMessage } from '@stacks/encryption';
// import { createStacksPrivateKey, signMessageHashRsv } from '@stacks/transactions';
// import { expect, test } from 'vitest';
// import { DevEnvHelper, WALLET_00, sbtcWithdrawHelper, sbtcWithdrawMessage } from '../src';

// const dev = new DevEnvHelper();

// test('btc tx, withdraw from sbtc, broadcast', async () => {
//   const bitcoinAccountA = await dev.getBitcoinAccount(WALLET_00); // funds the tx, can be anybody
//   const stacksAccount = await dev.getStacksAccount(WALLET_00);

//   const bitcoinAccountB = await dev.getBitcoinAccount(WALLET_00, 1); // recipient, can be anybody

//   // Tx prerequisites
//   const message = sbtcWithdrawMessage({
//     amountSats: 1_000,
//     bitcoinAddress: bitcoinAccountB.wpkh.address, // payout recipient
//   });

//   // - A browser extension could do this step
//   const signature = signMessageHashRsv({
//     messageHash: bytesToHex(hashMessage(message)),
//     privateKey: createStacksPrivateKey(stacksAccount.stxPrivateKey),
//   }).data;

//   // Tx building
//   const txStacksjs = await sbtcWithdrawHelper({
//     pegAddress: await dev.getSbtcPegAddress(),

//     amountSats: 1_000,
//     bitcoinAddress: bitcoinAccountB.wpkh.address, // payout recipient
//     signature,

//     fulfillmentFeeSats: 2_000, // fee for signers?

//     feeRate: await dev.estimateFeeRate('low'),
//     utxos: await dev.fetchUtxos(bitcoinAccountA.wpkh.address),

//     bitcoinChangeAddress: bitcoinAccountA.wpkh.address, // tx sender
//   });

//   // Instead we could PSBT and sign via extension wallet
//   txStacksjs.sign(bitcoinAccountA.privateKey); // same account as utxo (which are funding the tx)
//   txStacksjs.finalize();

//   const txid = await dev.broadcastTx(txStacksjs);
//   console.log('txid', txid);
// });

// test('btc tx, withdraw from sbtc, tx compare', async () => {
//   const bitcoinAccountA = await dev.getBitcoinAccount(WALLET_00, 1); // funds the tx, can be anybody
//   const stacksAccount = await dev.getStacksAccount(WALLET_00, 1);

//   const bitcoinAccountB = await dev.getBitcoinAccount(WALLET_00, 1); // recipient, can be anybody

//   // Tx prerequisites
//   const message = sbtcWithdrawMessage({
//     amountSats: 1_000,
//     bitcoinAddress: bitcoinAccountB.wpkh.address, // payout recipient
//   });

//   // - A browser extension could do this step
//   const signature = signMessageHashRsv({
//     messageHash: bytesToHex(hashMessage(message)),
//     privateKey: createStacksPrivateKey(stacksAccount.stxPrivateKey),
//   }).data;

//   // todo: compare with sbtc-bridge-lib

//   // Tx building
//   const txStacksjs = await sbtcWithdrawHelper({
//     pegAddress: await dev.getSbtcPegAddress(),

//     amountSats: 1_000,
//     bitcoinAddress: bitcoinAccountB.wpkh.address, // payout recipient
//     signature,

//     fulfillmentFeeSats: 2_000, // fee for signers?

//     feeRate: await dev.estimateFeeRate('low'),
//     utxos: await dev.fetchUtxos(bitcoinAccountA.wpkh.address),

//     bitcoinChangeAddress: bitcoinAccountA.wpkh.address, // tx sender
//   });

//   txStacksjs.sign(bitcoinAccountA.privateKey); // same account as utxo (which are funding the tx)
//   txStacksjs.finalize();

//   // generated with ./utils/withdraw.sh (set to amount=1000)
//   const hexCli =
//     '010000000001010221549531adce86b1fbcc178c0535d85d90b7f521d284df018b43f5529650730000000000feffffff0400000000000000004f6a4c4c54323e00000000000003e800070a03a62bf8ba00ebe1712ce17546e11a0b62b7e21ee45db6feaa5559951f106b8ae37ee0af60af2378261ac401fb417e46a46ac09d21e939236c77d8c52faa260100000000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e0d0070000000000002251205e682db7c014ab76f2b4fdcbbdb76f9b8111468174cdb159df6e88fe9d078ce68a2550090000000016001488bfaab3ad5f2f164e1cbb50cd07658ccea264e00247304402202252b47a3fc9df631b304017a43eac30e115167549f287f7a0b4449ac372b37102203f2f6b6dd9879a1f2cc69a654ff922f3d2bdac9a6fe85ca13a10f0c6e72c06b4012103969ff3e2bf7f2f73dc903cd11442032c8c7811d57d96ce327ee89c9edea63fa8a0030000';
//   const txCli = btc.Transaction.fromRaw(hexToBytes(hexCli), {
//     allowUnknownInputs: true,
//     allowUnknownOutputs: true,
//   });

//   // todo: output[0] uses incorrect magic bytes on regtest for withdraw via CLI (uses testnet magic bytes)
//   // expect(txStacksjs.getOutput(0).script!).toEqual(txCli.getOutput(0).script!);
//   expect(txStacksjs.getOutput(1).script!).toEqual(txCli.getOutput(1).script!);
//   expect(txStacksjs.getOutput(2).script!).toEqual(txCli.getOutput(2).script!);
//   expect(txStacksjs.outputsLength).toEqual(txCli.outputsLength);

//   // todo: output[1], can have less amount than signature signs, and sbtc will send less
//   // todo: sbtc doesn't burn the sbtc, the sbtc balance is still on stacks
// });
