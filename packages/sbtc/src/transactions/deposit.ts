import * as btc from '@scure/btc-signer';
import { hexToBytes, intToHex, utf8ToBytes } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import * as P from 'micro-packed';
import * as api from './api';
import { BlockstreamUtxo, BlockstreamUtxoWithTxHex } from './api';
import {
  BitcoinNetwork,
  MagicBytes,
  OVERHEAD_TX,
  OpCode,
  SBTC_PEG_ADDRESS,
  TEST_NETWORK,
  VSIZE_INPUT_P2WPKH,
} from './constants';
import { dustMinimum, paymentInfo, stacksAddressBytes } from './utils';

// todo: move to constants?

const concat = P.concatBytes;

export function buildSBtcDepositBtcPayload({
  network: net,
  address,
}: {
  network: BitcoinNetwork;
  address: string;
}): Uint8Array {
  const magicBytes =
    net.bech32 === 'tb' ? hexToBytes(MagicBytes.Testnet) : hexToBytes(MagicBytes.Mainnet);
  const opCodeBytes = hexToBytes(OpCode.PegIn);
  return concat(magicBytes, opCodeBytes, stacksAddressBytes(address));
}

/**  */
export const buildSbtcDepositTx = buildSbtcDepositTxOpReturn; // default to OP RETURN for developer release

/**
 *
 */
export function buildSbtcDepositTxOpReturn({
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
  const data = buildSBtcDepositBtcPayload({ network, address: stacksAddress });

  const tx = new btc.Transaction({
    // todo: disbale unknown
    allowUnknownInputs: true,
    allowUnknownOutputs: true,
  });
  tx.addOutput({ script: btc.Script.encode(['RETURN', data]), amount: BigInt(0) });
  tx.addOutputAddress(pegAddress, BigInt(amountSats), network);

  return tx;
}

export async function sbtcDepositHelper({
  network = TEST_NETWORK, // default to testnet for developer release
  amountSats,
  stacksAddress,
  bitcoinChangeAddress,
  utxos,
  feeRate,
  pegAddress = SBTC_PEG_ADDRESS,
}: {
  network?: BitcoinNetwork;
  amountSats: number;
  stacksAddress: string;
  bitcoinChangeAddress: string;
  utxos: (BlockstreamUtxo | BlockstreamUtxoWithTxHex)[];
  feeRate: number;
  pegAddress?: string;
}) {
  const tx = buildSbtcDepositTxOpReturn({ network, amountSats, stacksAddress, pegAddress });

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
