import * as btc from '@scure/btc-signer';
import { hexToBytes, intToHex, utf8ToBytes } from '@stacks/common';
import { c32addressDecode } from 'c32check';
import * as P from 'micro-packed';
import { UtxoWithTx } from './api';
import { BitcoinNetwork, OVERHEAD_TX, VSIZE_INPUT_P2WPKH } from './constants';

const concat = P.concatBytes;

// todo: move to transactions package
export function stacksAddressBytes(address: string): Uint8Array {
  const [addr, contractName] = address.split('.');
  const [version, hash] = c32addressDecode(addr);
  const versionBytes = hexToBytes(version.toString(16));
  const hashBytes = hexToBytes(hash);
  const contractNameBytes = lengthPrefixedString(contractName, utf8ToBytes);

  return concat(versionBytes, hashBytes, contractNameBytes);
}

// todo: move to transactions package
export function lengthPrefixedString(
  something: string | null | undefined,
  map: (something: string) => Uint8Array = utf8ToBytes,
  maxByteLength: number = 40,
  prefixByteLength: number = 1
): Uint8Array {
  if (!something) return new Uint8Array(0); // empty or nullish (optional)

  const bytes = map(something);
  if (maxByteLength >= 0 && bytes.byteLength > maxByteLength)
    throw new RangeError(`Content byteLength exceeds maximum length of ${maxByteLength}`);

  const prefixBytes = hexToBytes(intToHex(bytes.byteLength, prefixByteLength));
  if (prefixBytes.byteLength > prefixByteLength)
    throw new RangeError(`Prefix byteLength exceeds maximum length of ${prefixByteLength}`);

  return concat(prefixBytes, bytes);
}

export async function paymentInfo({
  tx,
  feeRate,
  utxos,
  utxoToSpendable,
}: {
  tx: btc.Transaction;
  feeRate: number;
  utxos: UtxoWithTx[];
  utxoToSpendable: Partial<SpendableByScriptTypes>;
}) {
  const outputs = []; // can't enumerate directly
  for (let i = 0; i < tx.outputsLength; i++) outputs.push(tx.getOutput(i));

  return await utxoSelect({ feeRate, utxos, utxoToSpendable, outputs });
}

// == vsizing ==================================================================

export function txBytes(inputs: btc.TransactionInput[], outputs: btc.TransactionOutput[]) {
  return (
    OVERHEAD_TX + inputs.map(inputBytes).reduce(plus, 0) + outputs.map(outputBytes).reduce(plus, 0)
  );
}

// todo: switch to estimating?

export function inputBytes(input: btc.TransactionInput) {
  const tmpTx = new btc.Transaction({ allowUnknownInputs: true });
  const originalSize = tmpTx.vsize;
  tmpTx.addInput(input);
  return tmpTx.vsize - originalSize;
  // return OVERHEAD_INPUT + (input.finalScriptWitness ? input.finalScriptWitness.byteLength : OVERHEAD_INPUT_P2PKH);
}

export function outputBytes(output: btc.TransactionOutput) {
  const tmpTx = new btc.Transaction({ allowUnknownOutputs: true });
  const originalSize = tmpTx.vsize;
  tmpTx.addOutput(output);
  return tmpTx.vsize - originalSize;
  // return OVERHEAD_OUTPUT + (output.script ? output.script.byteLength : OVERHEAD_OUTPUT_P2PKH);
}

export function dustMinimum(inputVsize: number, feeRate: number) {
  return Math.ceil(inputVsize * feeRate);
}

const plus = (a: number, b: number) => a + b;

export type Spendable = { input: btc.TransactionInput; vsize?: number };

export type SpendableByScriptTypes =
  // prettier-ignore
  { [Property in 'unknown' | 'sh' | 'wpkh' | 'wsh' | 'pk' | 'pkh' | 'ms' | 'tr' | 'tr_ns' | 'tr_ms']: (opts: UtxoToSpendableOpts) => Spendable | Promise<Spendable>; };

export const DEFAULT_UTXO_TO_SPENDABLE: Partial<SpendableByScriptTypes> = {
  wpkh: wpkhUtxoToSpendable,
  // sh: shUtxoToSpendable, // needs partial applying to work
};

interface UtxoToSpendableOpts {
  tx: btc.Transaction;
  txHex: string;
  utxo: UtxoWithTx;
  output: ReturnType<btc.Transaction['getOutput']>;
  spendScript: ReturnType<typeof btc.OutScript.decode>;
}

export function wpkhUtxoToSpendable(opts: UtxoToSpendableOpts) {
  if (!opts.output?.script) throw new Error('No script found on utxo tx');

  const spendableInput: btc.TransactionInput = {
    txid: hexToBytes(opts.utxo.txid),
    index: opts.utxo.vout,
    ...opts.output,
    witnessUtxo: {
      script: opts.output.script,
      amount: BigInt(opts.utxo.value),
    },
  };

  new btc.Transaction().addInput(spendableInput); // validate, throws if invalid
  return { input: spendableInput, vsize: VSIZE_INPUT_P2WPKH };
}

export function shUtxoToSpendable(
  net: BitcoinNetwork,
  paymentPublicKey: string,
  opts: UtxoToSpendableOpts
): Spendable | Promise<Spendable> {
  if (!opts.output?.script) throw new Error('No script found on utxo tx');

  let p2shRet;
  // Taken from https://github.com/Stacks-Builders/sbtc-bridge-api/blob/97e14f3e1bfb76e215c8f0311555240703ef9d69/sbtc-bridge-lib/src/wallet_utils.ts#L196
  // todo: refactor!!!
  for (let i = 0; i < 10; i++) {
    try {
      if (i === 0) {
        p2shRet = btc.p2sh(btc.p2wpkh(hexToBytes(paymentPublicKey)), net);
      } else if (i === 1) {
        p2shRet = btc.p2sh(btc.p2wsh(btc.p2wpkh(hexToBytes(paymentPublicKey))), net);
      } else if (i === 2) {
        p2shRet = btc.p2sh(btc.p2wsh(btc.p2pkh(hexToBytes(paymentPublicKey)), net));
      } else if (i === 3) {
        p2shRet = btc.p2sh(btc.p2ms(1, [hexToBytes(paymentPublicKey)]), net);
      } else if (i === 4) {
        p2shRet = btc.p2sh(btc.p2pkh(hexToBytes(paymentPublicKey)), net);
      } else if (i === 5) {
        p2shRet = btc.p2sh(btc.p2sh(btc.p2pkh(hexToBytes(paymentPublicKey)), net));
      } else if (i === 6) {
        p2shRet = btc.p2sh(btc.p2sh(btc.p2wpkh(hexToBytes(paymentPublicKey)), net));
      }

      if (!p2shRet) throw new Error('No valid p2sh variant found.');

      // wrapped witness script
      if (i < 3) {
        const input: btc.TransactionInput = {
          txid: hexToBytes(opts.utxo.txid),
          index: opts.utxo.vout,
          witnessUtxo: {
            script: p2shRet.script,
            amount: BigInt(opts.utxo.value),
          },
          redeemScript: p2shRet.redeemScript,
        };
        new btc.Transaction().addInput(input);
        return { input, vsize: VSIZE_INPUT_P2WPKH + (p2shRet.script?.byteLength ?? 0) };
      }

      const input = {
        txid: hexToBytes(opts.utxo.txid),
        index: opts.utxo.vout,
        nonWitnessUtxo: opts.txHex,
        redeemScript: p2shRet.redeemScript,
      } as unknown as btc.TransactionInput; // todo: something wrong with types here?
      new btc.Transaction().addInput(input);
      return { input, vsize: p2shRet.script?.byteLength ?? 0 };
    } catch (e) {}
  }
  throw new Error('No valid p2sh variant found.');
}

export async function utxoSelect({
  feeRate,
  utxos,
  utxoToSpendable,
  outputs,
}: {
  feeRate: number;
  utxos: UtxoWithTx[];
  utxoToSpendable: Partial<SpendableByScriptTypes>;
  outputs: btc.TransactionOutput[];
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
      const { input, vsize } = await switchUtxoToSpendable(utxo, utxoToSpendable);
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
      console.warn(`Failed to make UTXO spendable; txid: ${utxo.txid}\n`, e);
      continue; // skip if utxo is not spendable
    }
  }

  throw new Error('Not enough funds');
}

// todo: add p2sh for xverse
export async function switchUtxoToSpendable(
  utxo: UtxoWithTx,
  utxoToSpendable: Partial<SpendableByScriptTypes>
): Promise<Spendable> {
  const hex = await utxo.tx;
  const tx = btc.Transaction.fromRaw(hexToBytes(hex), {
    allowUnknownOutputs: true,
    allowUnknownInputs: true,
  });

  const outputToSpend = tx.getOutput(utxo.vout);
  if (!outputToSpend?.script) throw new Error('No script found on utxo tx');
  const spendScript = btc.OutScript.decode(outputToSpend.script);

  try {
    const fn = utxoToSpendable[spendScript.type];
    if (!fn) throw new Error(`Unsupported script type: ${spendScript.type}`);

    return await fn({
      tx,
      txHex: hex,
      utxo,
      output: outputToSpend,
      spendScript,
    });
  } catch (e) {
    throw new Error(`Failed to make utxo spendable. ${JSON.stringify(utxo)}`, { cause: e });
  }
}

const x: btc.TransactionInput | btc.TransactionOutput = {} as any;
if ('index' in x) x;

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

type LazyLoadable<T extends object, K extends string> = T & Record<K, any>;

export function wrapLazyProxy<
  T extends {
    [key: string]: any;
  },
  K extends string,
  R,
>(target: T, key: K, resolution: () => R | Promise<R>): LazyLoadable<T, K> {
  return new Proxy(target, {
    get(obj, prop: string) {
      if (prop === key && obj[prop] === undefined) {
        (obj as any)[prop] = Promise.resolve(resolution()).catch(error => {
          delete obj[prop];
          throw error;
        });
      }
      return obj[prop];
    },
    has(obj, prop) {
      if (prop === key) return true;
      return prop in obj;
    },
  });
}
