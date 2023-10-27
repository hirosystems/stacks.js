import * as btc from '@scure/btc-signer';
import { asciiToBytes, hexToBytes } from '@stacks/common';
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
  stacksAddressBytes,
} from '../utils';

const concat = P.concatBytes;

export function buildSBtcDepositBtcPayload({
  network,
  address,
}: {
  network: BitcoinNetwork;
  address: string;
}): Uint8Array {
  const magicBytes = asciiToBytes(network.magicBytes);
  const opCodeBytes = hexToBytes(OpCode.PegIn);
  const principalTypeBytes = address.includes('.') ? hexToBytes('06') : hexToBytes('05');
  return concat(magicBytes, opCodeBytes, principalTypeBytes, stacksAddressBytes(address));
}

/**  */
export const buildSbtcDepositTx = buildSbtcDepositTxOpReturn; // default to OP RETURN for developer release

/**
 *
 */
export function buildSbtcDepositTxOpReturn({
  network = REGTEST,
  amountSats,
  stacksAddress,
  pegAddress = SBTC_PEG_ADDRESS_DEVENV,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  stacksAddress: string;
  pegAddress?: string;
}) {
  const data = buildSBtcDepositBtcPayload({ network, address: stacksAddress });

  const tx = new btc.Transaction({
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(pegAddress, BigInt(amountSats), network);

  return tx;
}

export async function sbtcDepositHelper({
  network = REGTEST,
  amountSats,
  stacksAddress,
  bitcoinChangeAddress,
  feeRate,
  utxos,
  utxoToSpendable = DEFAULT_UTXO_TO_SPENDABLE,
  pegAddress = SBTC_PEG_ADDRESS_DEVENV,
  paymentPublicKey,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  stacksAddress: string;
  bitcoinChangeAddress: string;
  feeRate: number;
  utxos: UtxoWithTx[];
  /**
   * Tries to convert p2wpk and p2sh utxos to spendable inputs by default.
   * To extend, add your own function that takes a {@link UtxoToSpendableOpts}
   * and returns a {@link Spendable}.
   */
  utxoToSpendable?: Partial<SpendableByScriptTypes>;
  pegAddress?: string;
  paymentPublicKey?: string;
}) {
  if (paymentPublicKey) {
    utxoToSpendable.sh = shUtxoToSpendable.bind(null, network, paymentPublicKey);
  }

  const tx = buildSbtcDepositTxOpReturn({ network, amountSats, stacksAddress, pegAddress });

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
