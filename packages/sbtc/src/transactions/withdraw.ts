import * as btc from '@scure/btc-signer';
import { asciiToBytes, bytesToHex, hexToBytes } from '@stacks/common';
import * as P from 'micro-packed';
import { UtxoWithTx } from '../api';
import {
  BitcoinNetwork,
  OpCode,
  REGTEST,
  SBTC_PEG_ADDRESS_DEVENV,
  VSIZE_INPUT_P2WPKH,
} from '../constants';

import {
  DEFAULT_UTXO_TO_SPENDABLE,
  SpendableByScriptTypes,
  dustMinimum,
  paymentInfo,
  shUtxoToSpendable,
} from '../utils';

const concat = P.concatBytes;

export async function sbtcWithdrawHelper({
  network = REGTEST,
  amountSats,
  signature,
  fulfillmentFeeSats,
  bitcoinAddress,
  bitcoinChangeAddress,
  pegAddress = SBTC_PEG_ADDRESS_DEVENV,
  feeRate,
  utxos,
  utxoToSpendable = DEFAULT_UTXO_TO_SPENDABLE,
  paymentPublicKey,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
  fulfillmentFeeSats: number;
  /**
   * Recipient address.
   * ~(Will also be used as change address if `bitcoinChangeAddress` is not specified)~ todo
   */
  bitcoinAddress: string;
  bitcoinChangeAddress: string;
  pegAddress?: string;
  feeRate: number;
  utxos: UtxoWithTx[];
  /**
   * Tries to convert p2wpk and p2sh utxos to spendable inputs by default.
   * To extend, add your own function that takes a {@link UtxoToSpendableOpts}
   * and returns a {@link Spendable}.
   */
  utxoToSpendable?: Partial<SpendableByScriptTypes>;
  paymentPublicKey?: string;
}) {
  // bitcoinChangeAddress ??= bitcoinAddress; // todo: maybe not expected

  if (paymentPublicKey) {
    utxoToSpendable.sh = shUtxoToSpendable.bind(null, network, paymentPublicKey);
  }

  const tx = buildSbtcWithdrawTxOpReturn({
    network,
    amountSats,
    signature,
    bitcoinAddress,
  });
  tx.addOutputAddress(pegAddress, BigInt(fulfillmentFeeSats), network);

  // we separate this part, since wallets could handle it themselves
  const pay = await paymentInfo({ tx, feeRate, utxos, utxoToSpendable });
  for (const input of pay.inputs) tx.addInput(input);

  const changeAfterAdditionalOutput =
    pay.changeSats - BigInt(Math.ceil(VSIZE_INPUT_P2WPKH * feeRate));
  if (changeAfterAdditionalOutput > dustMinimum(VSIZE_INPUT_P2WPKH, feeRate)) {
    tx.addOutputAddress(bitcoinChangeAddress, changeAfterAdditionalOutput, network);
  }

  return tx;
}

export const buildSbtcWithdrawTx = buildSbtcWithdrawTxOpReturn; // default to OP RETURN for developer release

export function buildSbtcWithdrawTxOpReturn({
  network = REGTEST,
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
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(bitcoinAddress, BigInt(amountSats), network);

  return tx;
}

export function buildSBtcWithdrawBtcPayload({
  network = REGTEST,
  amountSats,
  signature,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
}): Uint8Array {
  const magicBytes = asciiToBytes(network.magicBytes);
  const opCodeBytes = hexToBytes(OpCode.PegOut);
  const amountBytes = P.U64BE.encode(BigInt(amountSats));
  const signatureBytes = hexToBytes(signature.slice(signature.length - 2) + signature.slice(0, -2)); // todo: maybe auto-detectable?
  return concat(magicBytes, opCodeBytes, amountBytes, signatureBytes);
}

export function sbtcWithdrawMessage({
  network = REGTEST,
  amountSats,
  bitcoinAddress,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  bitcoinAddress: string;
}): string {
  const amountBytes = P.U64BE.encode(BigInt(amountSats));
  const scriptOut = btc.OutScript.encode(btc.Address(network).decode(bitcoinAddress));
  const data = concat(amountBytes, scriptOut);

  // prettier-ignore
  return `Withdraw request for ${amountSats} satoshis to the bitcoin address ${bitcoinAddress} (${bytesToHex(data)})`;
}
