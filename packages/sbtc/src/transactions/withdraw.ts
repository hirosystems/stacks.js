import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import * as P from 'micro-packed';
import { UtxoWithTx } from './api';
import { BitcoinNetwork, MagicBytes, OpCode, TESTNET, VSIZE_INPUT_P2WPKH } from './constants';

import { SpendableByScriptTypes, dustMinimum, paymentInfo } from './utils';

const concat = P.concatBytes;

const DUST = 500; // todo: double-check

export async function sbtcWithdrawHelper({
  network = TESTNET, // default to testnet for developer release
  amountSats,
  signature,
  bitcoinAddress,
  bitcoinChangeAddress,
  feeRate,
  utxos,
  utxoToSpendable,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
  bitcoinAddress: string;
  bitcoinChangeAddress?: string;
  feeRate: number;
  utxos: UtxoWithTx[];
  utxoToSpendable: Partial<SpendableByScriptTypes>;
}) {
  bitcoinChangeAddress ??= bitcoinAddress;

  const tx = buildSbtcWithdrawTxOpReturn({
    network,
    amountSats,
    signature,
    bitcoinAddress,
  });

  // we separate this part, since wallets could handle it themselves
  const pay = await paymentInfo({ tx, feeRate, utxos, utxoToSpendable });
  for (const input of pay.inputs) tx.addInput(input);

  const changeAfterAdditionalOutput =
    BigInt(Math.ceil(VSIZE_INPUT_P2WPKH * feeRate)) - pay.changeSats;
  if (changeAfterAdditionalOutput > dustMinimum(VSIZE_INPUT_P2WPKH, feeRate)) {
    tx.addOutputAddress(bitcoinChangeAddress, changeAfterAdditionalOutput, network);
  }

  return tx;
}

export const buildSbtcWithdrawTx = buildSbtcWithdrawTxOpReturn; // default to OP RETURN for developer release

export function buildSbtcWithdrawTxOpReturn({
  network = TESTNET, // default to testnet for developer release
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
