import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import * as P from 'micro-packed';
import { BlockstreamUtxo, BlockstreamUtxoWithTxHex } from './api';
import { BitcoinNetwork, MagicBytes, OpCode, TEST_NETWORK, VSIZE_INPUT_P2WPKH } from './constants';

import { dustMinimum, paymentInfo } from './utils';

const concat = P.concatBytes;

export async function sbtcWithdrawHelper({
  network = TEST_NETWORK, // default to testnet for developer release
  amountSats,
  signature,
  bitcoinAddress,
  bitcoinChangeAddress,
  utxos,
  feeRate,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
  bitcoinAddress: string;
  bitcoinChangeAddress?: string;
  utxos: (BlockstreamUtxo | BlockstreamUtxoWithTxHex)[];
  feeRate: number;
}) {
  bitcoinChangeAddress ??= bitcoinAddress;

  const tx = buildSbtcWithdrawTxOpReturn({
    network,
    amountSats,
    signature,
    bitcoinAddress,
  });

  // we separate this part, since wallets could handle it themselves
  const pay = await paymentInfo({ tx, utxos, feeRate });
  for (const input of pay.inputs) tx.addInput(input);
  // outputs are already on tx

  const changeAfterAdditionalOutput =
    BigInt(Math.ceil(VSIZE_INPUT_P2WPKH * feeRate)) - pay.changeSats;
  if (changeAfterAdditionalOutput > dustMinimum(VSIZE_INPUT_P2WPKH, feeRate)) {
    tx.addOutputAddress(bitcoinChangeAddress, changeAfterAdditionalOutput, network);
  }

  return tx;
}

const DUST = 500;

export function buildSbtcWithdrawTxOpReturn({
  network = TEST_NETWORK, // default to testnet for developer release
  amountSats,
  signature,
  bitcoinAddress,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
  bitcoinAddress: string;
}) {
  const data = buildSBtcWithdrawBtcPayload({ network, amountSats, signature });

  const tx = new btc.Transaction({
    // todo: disbale unknown
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(bitcoinAddress, BigInt(DUST), network);

  return tx;
}

export function buildSBtcWithdrawBtcPayload({
  network: net,
  amountSats,
  signature,
}: {
  network: BitcoinNetwork;
  amountSats: number;
  signature: string;
}): Uint8Array {
  const magicBytes =
    net.bech32 === 'tb' ? hexToBytes(MagicBytes.Testnet) : hexToBytes(MagicBytes.Mainnet);
  const opCodeBytes = hexToBytes(OpCode.PegOut);
  const amountBytes = P.U64BE.encode(BigInt(amountSats));
  const signatureBytes = hexToBytes(signature);
  return concat(magicBytes, opCodeBytes, amountBytes, signatureBytes);
}
