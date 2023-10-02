import * as btc from '@scure/btc-signer';
import { hexToBytes, intToHex, utf8ToBytes } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import * as P from 'micro-packed';
import * as api from './api';
import { BlockstreamUtxo, BlockstreamUtxoWithTxHex } from './api';
import { MagicBytes, OpCode } from './constants';

// todo: move to constants?

// Estimates based on https://bitcoinops.org/en/tools/calc-size/
const OVERHEAD_TX = 4 + 1 + 1 + 4; // new btc.Transaction().vsize
// const OVERHEAD_INPUT = 36 + 1 + 4 + 0.25;
// const OVERHEAD_OUTPUT = 8 + 1;
// const OVERHEAD_INPUT_P2PKH = 107;
const VSIZE_INPUT_P2WPKH = 68;
// const OVERHEAD_OUTPUT_P2PKH = 25;

const concat = P.concatBytes;

interface BitcoinNetwork {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

export const NETWORK: BitcoinNetwork = btc.NETWORK;
export const TEST_NETWORK: BitcoinNetwork = btc.TEST_NETWORK;

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

function stacksAddressBytes(address: string): Uint8Array {
  const [addr, contractName] = address.split('.');
  const [version, hash] = c32addressDecode(addr);
  const versionBytes = hexToBytes(version.toString(16));
  const hashBytes = hexToBytes(hash);
  const contractNameBytes = lengthPrefixedString(contractName, utf8ToBytes);

  return concat(versionBytes, hashBytes, contractNameBytes);
}

// todo: move to utils somewhere
function lengthPrefixedString(
  something: string | null | undefined,
  map: (something: string) => Uint8Array = utf8ToBytes,
  maxByteLength: number = 40,
  prefixByteLength: number = 1
): Uint8Array {
  if (!something) return Uint8Array.from([0]); // empty or nullish (optional)

  const bytes = map(something);
  if (maxByteLength >= 0 && bytes.byteLength > maxByteLength)
    throw new RangeError(`Content byteLength exceeds maximum length of ${maxByteLength}`);

  const prefixBytes = hexToBytes(intToHex(bytes.byteLength, prefixByteLength));
  if (prefixBytes.byteLength > prefixByteLength)
    throw new RangeError(`Prefix byteLength exceeds maximum length of ${prefixByteLength}`);

  return concat(prefixBytes, bytes);
}

// todo: add p2sh for xverse
async function defaultUtxoToSpendable(
  utxo: BlockstreamUtxo | BlockstreamUtxoWithTxHex
): Promise<{ input: btc.TransactionInput; vsize?: number }> {
  const utxoWithTx: BlockstreamUtxoWithTxHex =
    'hex' in utxo ? utxo : { ...utxo, hex: await api.fetchTxHex(utxo.txid) };

  const tx = btc.Transaction.fromRaw(hexToBytes(utxoWithTx.hex), {
    allowUnknownOutputs: true,
    allowUnknownInputs: true,
  });

  const outputToSpend = tx.getOutput(utxo.vout);
  if (!outputToSpend?.script) throw new Error('No script found on utxo tx');
  const spendScript = btc.OutScript.decode(outputToSpend.script);

  try {
    if (spendScript.type !== 'wpkh') throw new Error('Non-p2wpkh utxo found');

    const spendableInput: btc.TransactionInput = {
      txid: hexToBytes(utxo.txid),
      index: utxo.vout,
      ...outputToSpend,
      witnessUtxo: {
        script: outputToSpend.script,
        amount: BigInt(utxo.value),
      },
    };
    new btc.Transaction().addInput(spendableInput); // validate, throws if invalid
    return { input: spendableInput, vsize: VSIZE_INPUT_P2WPKH };
  } catch (e) {
    throw new Error(`Utxo doesn't match spendable type, ${JSON.stringify(utxo)}`);
  }
}

// todo: after DR?
// async function tryAllToSpendable(
//   utxo: BlockstreamUtxo | BlockstreamUtxoWithTxHex
// ): Promise<btc.TransactionInput> {
//   const utxoWithTx: BlockstreamUtxoWithTxHex =
//     'hex' in utxo ? utxo : { ...utxo, hex: await fetchTxHex(utxo.txid) };

//   const tx = btc.Transaction.fromRaw(hexToBytes(utxoWithTx.hex), {
//     allowUnknownOutputs: true,
//     allowUnknownInputs: true,
//   });

//   const outputToSpend = tx.getOutput(utxo.vout);
//   if (!outputToSpend?.script) throw new Error('No script found on utxo tx');
//   const spendScript = btc.OutScript.decode(outputToSpend.script);

//   try {
//     switch (spendScript.type) {
//       case 'wpkh':
//       //
//     }
//   } catch (e) {
//     throw new Error(`Utxo doesn't match spendable type, ${JSON.stringify(utxo)}`);
//   }
// }

type UtxoToSpendableFn = (
  utxo: BlockstreamUtxo | BlockstreamUtxoWithTxHex
) => Promise<{ input: btc.TransactionInput; vsize?: number }>;

export async function utxoSelect({
  utxos,
  utxoToSpendable = defaultUtxoToSpendable,
  outputs,
  feeRate,
}: {
  utxos: (BlockstreamUtxo | BlockstreamUtxoWithTxHex)[];
  utxoToSpendable?: UtxoToSpendableFn;
  outputs: btc.TransactionOutput[];
  feeRate: number;
}): Promise<{
  inputs: btc.TransactionInput[];
  totalSats: bigint;
  changeSats: bigint;
}> {
  const outputsValue = outputs.reduce(
    (acc: bigint, o: btc.TransactionOutput) => acc + (o.amount ?? 0n),
    0n
  );

  const inputs: btc.TransactionInput[] = []; // collect inputs
  let inputRunning = 0n;

  let vsizeRunning = txBytes([], outputs);

  for (const utxo of utxos) {
    try {
      const { input, vsize } = await utxoToSpendable(utxo);
      const inputVsize = vsize ?? inputBytes(input);
      const utxoFee = feeRate * inputVsize;

      if (utxoFee > utxo.value) continue; // skip if utxo is too small to pay fee

      // add input
      inputs.push(input);
      inputRunning += BigInt(utxo.value);
      vsizeRunning += inputVsize;

      // check if we have enough inputs
      const fee = feeRate * vsizeRunning;
      if (inputRunning >= outputsValue + BigInt(Math.ceil(fee))) {
        const changeSats = inputRunning - (outputsValue + BigInt(Math.ceil(fee)));
        return { inputs, totalSats: inputRunning, changeSats };
      }
    } catch (e) {
      continue; // skip if utxo is not spendable
    }
  }

  throw new Error('Not enough funds');
}

/**  */
export const buildSbtcDepositTx = buildSbtcDepositTxOpReturn; // default to OP RETURN for developer release

const SBTC_PEG_ADDRESS = 'tb1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxt2t0zh'; // todo: auto-fetch or hardcode if final
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

export async function paymentInfo({
  tx,
  feeRate,
  utxos,
  utxoToSpendable = defaultUtxoToSpendable,
}: {
  tx: btc.Transaction;
  feeRate: number;
  utxos: (BlockstreamUtxo | BlockstreamUtxoWithTxHex)[];
  utxoToSpendable?: UtxoToSpendableFn;
}) {
  const outputs = [];
  for (let i = 0; i < tx.outputsLength; i++) {
    outputs.push(tx.getOutput(i));
  }

  return await utxoSelect({ utxos, utxoToSpendable, outputs, feeRate });
}

const plus = (a: number, b: number) => a + b;

function txBytes(inputs: btc.TransactionInput[], outputs: btc.TransactionOutput[]) {
  return (
    OVERHEAD_TX + inputs.map(inputBytes).reduce(plus, 0) + outputs.map(outputBytes).reduce(plus, 0)
  );
}

// todo: switch to estimating?

function inputBytes(input: btc.TransactionInput) {
  const tmpTx = new btc.Transaction({ allowUnknownInputs: true });
  const originalSize = tmpTx.vsize;
  tmpTx.addInput(input);
  return tmpTx.vsize - originalSize;
  // return OVERHEAD_INPUT + (input.finalScriptWitness ? input.finalScriptWitness.byteLength : OVERHEAD_INPUT_P2PKH);
}

function outputBytes(output: btc.TransactionOutput) {
  const tmpTx = new btc.Transaction({ allowUnknownOutputs: true });
  const originalSize = tmpTx.vsize;
  tmpTx.addOutput(output);
  return tmpTx.vsize - originalSize;
  // return OVERHEAD_OUTPUT + (output.script ? output.script.byteLength : OVERHEAD_OUTPUT_P2PKH);
}

function dustMinimum(inputVsize: number, feeRate: number) {
  return Math.ceil(inputVsize * feeRate);
}
