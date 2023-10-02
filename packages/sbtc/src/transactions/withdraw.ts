import * as btc from '@scure/btc-signer';
import { hexToBytes } from '@stacks/common';
import * as P from 'micro-packed';
import { BlockstreamUtxo, BlockstreamUtxoWithTxHex } from './api';
import {
  BitcoinNetwork,
  MagicBytes,
  OpCode,
  SBTC_PEG_ADDRESS,
  TEST_NETWORK,
  VSIZE_INPUT_P2WPKH,
} from './constants';

import { dustMinimum, paymentInfo, stacksAddressBytes } from './utils';

const concat = P.concatBytes;

export async function sbtcWithdrawHelper({
  network = TEST_NETWORK, // default to testnet for developer release
  amountSats,
  signature,
  stacksAddress,
  bitcoinChangeAddress,
  utxos,
  feeRate,
  pegAddress = SBTC_PEG_ADDRESS,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  signature: string;
  stacksAddress: string;
  bitcoinChangeAddress: string;
  utxos: (BlockstreamUtxo | BlockstreamUtxoWithTxHex)[];
  feeRate: number;
  pegAddress?: string;
}) {
  const tx = buildSbtcWithdrawTxOpReturn({ network, amountSats, stacksAddress, pegAddress });
  console.log(signature);

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

export function buildSbtcWithdrawTxOpReturn({
  network = TEST_NETWORK, // default to testnet for developer release
  amountSats,
  stacksAddress,
  pegAddress = SBTC_PEG_ADDRESS,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  stacksAddress: string;
  pegAddress?: string;
}) {
  const data = buildSBtcWithdrawBtcPayload({ network, address: stacksAddress });

  const tx = new btc.Transaction({
    // todo: disbale unknown
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(pegAddress, BigInt(amountSats), network);

  return tx;
}

export function buildSBtcWithdrawBtcPayload({
  network: net,
  address,
}: {
  network: BitcoinNetwork;
  address: string;
}): Uint8Array {
  const magicBytes =
    net.bech32 === 'tb' ? hexToBytes(MagicBytes.Testnet) : hexToBytes(MagicBytes.Mainnet);
  const opCodeBytes = hexToBytes(OpCode.PegOut);
  return concat(magicBytes, opCodeBytes, stacksAddressBytes(address));
}
