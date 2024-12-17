import * as btc from '@scure/btc-signer';
import { P2TROut } from '@scure/btc-signer/payment';
import { bytesToHex, hexToBytes } from '@stacks/common';
import * as P from 'micro-packed';
import { UtxoWithTx } from '../api';
import { BitcoinNetwork, MAINNET, VSIZE_INPUT_P2WPKH } from '../constants';
import {
  DEFAULT_UTXO_TO_SPENDABLE,
  SpendableByScriptTypes,
  dustMinimum,
  paymentInfo,
  shUtxoToSpendable,
  stacksAddressBytes,
} from '../utils';

export const DEFAULT_RECLAIM_LOCK_TIME = 12;
export const DEFAULT_MAX_SIGNER_FEE = 80_000;

/** Taken from [bip-0341.mediawiki](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki#user-content-Constructing_and_spending_Taproot_outputs) and [sbtc](https://github.com/stacks-network/sbtc/blob/a3a927f759871440962d8f8066108e5b0af696a0/sbtc/src/lib.rs#L28) */
export const UNSPENDABLE_PUB = new Uint8Array([
  0x50, 0x92, 0x9b, 0x74, 0xc1, 0xa0, 0x49, 0x54, 0xb7, 0x8b, 0x4b, 0x60, 0x35, 0xe9, 0x7a, 0x5e,
  0x07, 0x8a, 0x5a, 0x0f, 0x28, 0xec, 0x96, 0xd5, 0x47, 0xbf, 0xee, 0x9a, 0xce, 0x80, 0x3a, 0xc0,
]);

export function buildSbtcDepositScript(opts: {
  maxSignerFee: number;
  stacksAddress: string;
  signersPublicKey: string;
}) {
  const maxSignerFeeBytes = P.U64BE.encode(BigInt(opts.maxSignerFee));
  const recipientBytes = stacksAddressBytes(opts.stacksAddress);
  const signersPublicKeyBytes = hexToBytes(opts.signersPublicKey);

  if (signersPublicKeyBytes.length !== 32) {
    throw new Error('Signers public key must be 32 bytes (schnorr)');
  }

  return btc.Script.encode([
    P.utils.concatBytes(maxSignerFeeBytes, recipientBytes),
    'DROP',
    signersPublicKeyBytes,
    'CHECKSIG',
  ]);
}

export function buildSbtcReclaimScript(opts: {
  reclaimLockTime: number;
  reclaimPublicKey: string;
}) {
  const reclaimLockTime =
    opts.reclaimLockTime <= 16
      ? opts.reclaimLockTime // number if can be encoded as a OP_<n>
      : btc.ScriptNum().encode(BigInt(opts.reclaimLockTime));
  const publicKeyBytes = hexToBytes(opts.reclaimPublicKey);

  if (publicKeyBytes.length !== 32) throw new Error('Public key must be 32 bytes (schnorr)');

  return btc.Script.encode([
    reclaimLockTime,
    'CHECKSEQUENCEVERIFY',
    'DROP',
    publicKeyBytes,
    'CHECKSIG',
  ]);
}

function _buildSbtcDepositTr_Opts(opts: {
  network: BitcoinNetwork;
  stacksAddress: string;
  signersPublicKey: string;
  maxSignerFee: number;
  reclaimLockTime: number;
  reclaimPublicKey: string;
}) {
  const deposit = buildSbtcDepositScript(opts);
  const reclaim = buildSbtcReclaimScript(opts);

  return {
    depositScript: bytesToHex(deposit),
    reclaimScript: bytesToHex(reclaim),

    trOut: btc.p2tr(
      UNSPENDABLE_PUB,
      [{ script: deposit }, { script: reclaim }],
      opts.network,
      true // allow custom scripts
    ),
  };
}

// function _buildSbtcDepositTr_Raw(opts: {
//   network: BitcoinNetwork;
//   depositScript: string;
//   reclaimScript: string;
// }) {
//   return {
//     depositScript: opts.depositScript,
//     reclaimScript: opts.reclaimScript,

//     trOut: btc.p2tr(
//       UNSPENDABLE_PUB,
//       [{ script: hexToBytes(opts.depositScript) }, { script: hexToBytes(opts.reclaimScript) }],
//       opts.network,
//       true // allow custom scripts
//     ),
//   };
// }

export function buildSbtcDepositTr(opts: // | {
//     network: BitcoinNetwork;
//     depositScript: string;
//     reclaimScript: string;
//   }
{
  network: BitcoinNetwork;
  stacksAddress: string;
  signersPublicKey: string;
  maxSignerFee: number;
  reclaimLockTime: number;
  reclaimPublicKey: string;
}): {
  depositScript: string;
  reclaimScript: string;
  trOut: P2TROut;
} {
  // if ('depositScript' in opts) return _buildSbtcDepositTr_Raw(opts); // disable raw mode for now, since we need additional stuff anyway
  return _buildSbtcDepositTr_Opts(opts);
}

// todo: fix types to expose this
// export function buildSbtcReclaimInput(opts: {
//   network: BitcoinNetwork;
//   amountSats: number | bigint;
//   stacksAddress: string;
//   signersPublicKey: string;
//   maxSignerFee: number;
//   lockTime: number;
//   publicKey: string;

//   txid: string;
//   vout: number;
// }) {
//   const reclaimScript = buildSbtcReclaimScript(opts);

//   return {};
// }

export function buildSbtcReclaimTx({
  network = MAINNET,
  amountSats,
  bitcoinAddress,
  stacksAddress,
  signersPublicKey,
  maxSignerFee = DEFAULT_MAX_SIGNER_FEE,
  reclaimLockTime = DEFAULT_RECLAIM_LOCK_TIME,
  reclaimPublicKey,
  txid,
  vout = 0,
  feeRate,
}: {
  network?: BitcoinNetwork;
  amountSats: number | bigint;
  bitcoinAddress: string;

  /** The deposit recipient Stacks address (needed to reconstruct the deposit tx) */
  stacksAddress: string;
  /** The signers public key (aggregated schnorr; needed to reconstruct the deposit tx) */
  signersPublicKey: string;
  /** The max signer fee (needed to reconstruct the deposit tx), defaults to 80_000 */
  maxSignerFee?: number;
  /** The lock time (needed to reconstruct the deposit tx), defaults to 12 */
  reclaimLockTime?: number;
  /** The reclaim public key (schnorr; to reconstruct the deposit tx AND sign the reclaim tx) */
  reclaimPublicKey: string;

  // disable raw mode for now, since we need additional stuff anyway
  // depositScript: string;
  // reclaimScript: string;

  txid: string;
  vout?: number;

  /** Fee rate in sat/vbyte for the reclaim tx */
  feeRate: number;
}) {
  const tx = new btc.Transaction({ allowUnknownInputs: true, allowUnknownOutputs: true });
  if (tx.version !== 2) throw new Error('Transaction version must be == 2');

  const deposit = buildSbtcDepositTr({
    network,
    stacksAddress,
    signersPublicKey,
    maxSignerFee,
    reclaimLockTime,
    reclaimPublicKey,
  });

  if (deposit.trOut.tapLeafScript?.length !== 2) throw new Error('Failed to build deposit taproot');

  const reclaimTapLeaf = deposit.trOut.tapLeafScript[1]; // const [reclaimMeta, reclaimBytes] = deposit.trOut.tapLeafScript[1];

  if (!reclaimTapLeaf[0] || !reclaimTapLeaf[1]) throw new Error('Failed to build reclaim taproot');

  tx.addInput({
    txid,
    index: vout,
    witnessUtxo: {
      script: deposit.trOut.script,
      amount: BigInt(amountSats),
    },
    sequence: reclaimLockTime,
    tapLeafScript: [reclaimTapLeaf],
  });

  tx.addOutputAddress(bitcoinAddress, BigInt(amountSats), network);

  // hardcoded `tx.vsize` for this tx structure
  // we don't need additional inputs, since we're only spending one well-funded input (deposit)
  const VSIZE = 126;

  const fee = BigInt(Math.ceil(VSIZE * feeRate));
  if (fee > BigInt(amountSats)) throw new Error('Fee is higher than reclaim amount');

  tx.updateOutput(0, { amount: BigInt(amountSats) - fee });

  return tx;
}

export function buildSbtcDepositAddress({
  network = MAINNET,
  stacksAddress,
  signersPublicKey,
  maxSignerFee = DEFAULT_MAX_SIGNER_FEE,
  reclaimLockTime = DEFAULT_RECLAIM_LOCK_TIME,
  reclaimPublicKey,
}: {
  network: BitcoinNetwork;
  stacksAddress: string;
  /** Aggregated (schnorr) public key of all signers */
  signersPublicKey: string;
  /** The max signer fee (needed to reconstruct the deposit tx), defaults to 80_000 */
  maxSignerFee?: number;
  /** The lock time (needed to reconstruct the deposit tx), defaults to 12 */
  reclaimLockTime?: number;
  /** The reclaim public key (schnorr; to reconstruct the deposit tx AND sign the reclaim tx) */
  reclaimPublicKey: string;
}) {
  const tr = buildSbtcDepositTr({
    network,
    stacksAddress,
    signersPublicKey,
    maxSignerFee,
    reclaimLockTime,
    reclaimPublicKey,
  });
  if (!tr.trOut.address) throw new Error('Failed to create build taproot output');

  return {
    address: tr.trOut.address,
    ...tr,
  };
}

export function buildSbtcDepositTx({
  network = MAINNET,
  amountSats,
  stacksAddress,
  signersPublicKey,
  maxSignerFee,
  reclaimLockTime,
  reclaimPublicKey,
}: {
  network: BitcoinNetwork;
  amountSats: number | bigint;
  stacksAddress: string;
  /** Aggregated (schnorr) public key of all signers */
  signersPublicKey: string;
  maxSignerFee: number;
  reclaimLockTime: number;
  reclaimPublicKey: string;
}) {
  const deposit = buildSbtcDepositAddress({
    network,
    stacksAddress,
    signersPublicKey,
    maxSignerFee,
    reclaimLockTime,
    reclaimPublicKey,
  });

  const tx = new btc.Transaction();
  tx.addOutputAddress(deposit.address, BigInt(amountSats), network);

  return { transaction: tx, ...deposit };
}

export async function sbtcDepositHelper({
  network = MAINNET,
  amountSats,
  stacksAddress,
  bitcoinChangeAddress,
  signersPublicKey,
  feeRate,
  utxos,
  utxoToSpendable = DEFAULT_UTXO_TO_SPENDABLE,
  paymentPublicKey,
  reclaimPublicKey,
  maxSignerFee = DEFAULT_MAX_SIGNER_FEE,
  reclaimLockTime = DEFAULT_RECLAIM_LOCK_TIME,
}: {
  /** Bitcoin network, defaults to REGTEST */
  network?: BitcoinNetwork;
  /** Signers public key (aggregated schnorr) */
  signersPublicKey: string;

  /** Bitcoin amount denominated in sats (* 10^8) */
  amountSats: number;
  /** The deposit recipient Stacks address */
  stacksAddress: string;
  /** Bitcoin change address */
  bitcoinChangeAddress: string;
  /** Reclaim public key (schnorr) */
  reclaimPublicKey: string;
  /** Fee rate in sat/vbyte */
  feeRate: number;
  /** UTXOs to use for the transaction */
  utxos: UtxoWithTx[];

  /**
   * Tries to convert p2wpk and p2sh utxos to spendable inputs by default.
   * To extend, add your own function that takes a {@link UtxoToSpendableOpts}
   * and returns a {@link Spendable}.
   *
   * @example
   * ```ts
   * utxoToSpendable: [
   *   wpkh: myWpkhUtxoToSpendableFn,
   *   sh: myShUtxoToSpendableFn,
   *   // ...
   * ]
   * ```
   */
  utxoToSpendable?: Partial<SpendableByScriptTypes>;

  /** Optional maximum fee to pay for the deposit transaction, defaults to 80_000 */
  maxSignerFee?: number;
  /** Optional reclaim lock time, defaults to 6_000 */
  reclaimLockTime?: number;

  /** Optional payment public key (currently only used for the default `utxoToSpendable.sh` implementation) */
  paymentPublicKey?: string;
}) {
  if (paymentPublicKey) {
    utxoToSpendable.sh = shUtxoToSpendable.bind(null, network, paymentPublicKey);
  }

  const txInfo = buildSbtcDepositTx({
    network,
    amountSats,
    stacksAddress,
    signersPublicKey,
    maxSignerFee,
    reclaimLockTime,
    reclaimPublicKey,
  });

  // We separate this part, since wallets could handle it themselves
  const pay = await paymentInfo({ tx: txInfo.transaction, feeRate, utxos, utxoToSpendable });
  for (const input of pay.inputs) txInfo.transaction.addInput(input);

  const changeAfterAdditionalOutput =
    pay.changeSats - BigInt(Math.ceil(VSIZE_INPUT_P2WPKH * feeRate));
  if (changeAfterAdditionalOutput > dustMinimum(VSIZE_INPUT_P2WPKH, feeRate)) {
    txInfo.transaction.addOutputAddress(bitcoinChangeAddress, changeAfterAdditionalOutput, network);
  }

  return txInfo;
}
