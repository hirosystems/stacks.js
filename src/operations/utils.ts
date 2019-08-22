

import { TransactionBuilder, Transaction, TxOutput, crypto as bjsCrypto } from 'bitcoinjs-lib'
import * as RIPEMD160 from 'ripemd160'
// @ts-ignore
import * as BN from 'bn.js'
import { NotEnoughFundsError } from '../errors'
import { TransactionSigner } from './signers'
import { UTXO } from '../network'


/**
 * 
 * @ignore
 */
export const DUST_MINIMUM = 5500

/**
 * 
 * @ignore
 */
export function hash160(buff: Buffer) {
  const sha256 = bjsCrypto.sha256(buff)
  return (new RIPEMD160()).update(sha256).digest()
}

/**
 * 
 * @ignore
 */
export function hash128(buff: Buffer) {
  return Buffer.from(bjsCrypto.sha256(buff).slice(0, 16))
}


// COPIED FROM coinselect, because 1 byte matters sometimes.
// baseline estimates, used to improve performance
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4
const TX_INPUT_BASE = 32 + 4 + 1 + 4
const TX_INPUT_PUBKEYHASH = 107
const TX_OUTPUT_BASE = 8 + 1
const TX_OUTPUT_PUBKEYHASH = 25

type txPoint = {
  script: { length: number }
}

function inputBytes(input: txPoint | null) {
  if (input && input.script && input.script.length > 0) {
    return TX_INPUT_BASE + input.script.length
  } else {
    return TX_INPUT_BASE + TX_INPUT_PUBKEYHASH
  }
}

function outputBytes(output: txPoint | null) {
  if (output && output.script && output.script.length > 0) {
    return TX_OUTPUT_BASE + output.script.length
  } else {
    return TX_OUTPUT_BASE + TX_OUTPUT_PUBKEYHASH
  }
}

function transactionBytes(inputs: Array<txPoint | null>, outputs: Array<txPoint | null>) {
  return TX_EMPTY_SIZE
    + inputs.reduce((a: number, x: txPoint | null) => (a + inputBytes(x)), 0)
    + outputs.reduce((a: number, x: txPoint | null) => (a + outputBytes(x)), 0)
}

/**
 * 
 * @ignore
 */
export function getTransactionInsideBuilder(txBuilder: TransactionBuilder) {
  return ((txBuilder as any).__TX as Transaction)
}

function getTransaction(txIn: Transaction | TransactionBuilder) {
  if (txIn instanceof Transaction) {
    return txIn
  }
  return getTransactionInsideBuilder(txIn)
}

//

/**
 * 
 * @ignore
 */
export function estimateTXBytes(txIn: Transaction | TransactionBuilder,
                                additionalInputs: number,
                                additionalOutputs: number) {
  const innerTx = getTransaction(txIn)
  const dummyInputs: Array<null> = new Array(additionalInputs)
  dummyInputs.fill(null)
  const dummyOutputs: Array<null> = new Array(additionalOutputs)
  dummyOutputs.fill(null)

  const inputs: Array<null | txPoint> = [].concat(innerTx.ins, dummyInputs)
  const outputs: Array<null | txPoint> = [].concat(innerTx.outs, dummyOutputs)

  return transactionBytes(inputs, outputs)
}

/**
 * 
 * @ignore
 */
export function sumOutputValues(txIn: Transaction | TransactionBuilder) {
  const innerTx = getTransaction(txIn)
  return innerTx.outs.reduce((agg, x) => agg + (x as TxOutput).value, 0)
}

/**
 * 
 * @ignore
 */
export function decodeB40(input: string) {
  // treat input as a base40 integer, and output a hex encoding
  // of that integer.
  //
  //   for each digit of the string, find its location in `characters`
  //    to get the value of the digit, then multiply by 40^(-index in input)
  // e.g.,
  // the 'right-most' character has value: (digit-value) * 40^0
  //  the next character has value: (digit-value) * 40^1
  //
  // hence, we reverse the characters first, and use the index
  //  to compute the value of each digit, then sum
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz-_.+'
  const base = new BN(40)
  const inputDigits = input.split('').reverse()
  const digitValues = inputDigits.map(
    ((character: string, exponent: number) => new BN(characters.indexOf(character))
      .mul(base.pow(new BN(exponent))))
  )
  const sum = digitValues.reduce(
    (agg: BN, cur: BN) => agg.add(cur),
    new BN(0)
  )
  return sum.toString(16, 2)
}

/**
 * Adds UTXOs to fund a transaction
 * @param {TransactionBuilder} txBuilderIn - a transaction builder object to add the inputs to. this
 *    object is _always_ mutated. If not enough UTXOs exist to fund, the tx builder object
 *    will still contain as many inputs as could be found.
 * @param {Array<{value: number, tx_hash: string, tx_output_n}>} utxos - the utxo set for the
 *    payer's address.
 * @param {number} amountToFund - the amount of satoshis to fund in the transaction. the payer's
 *    utxos will be included to fund up to this amount of *output* and the corresponding *fees*
 *    for those additional inputs
 * @param {number} feeRate - the satoshis/byte fee rate to use for fee calculation
 * @param {boolean} fundNewFees - if true, this function will fund `amountToFund` and any new fees
 *    associated with including the new inputs.
 *    if false, this function will fund _at most_ `amountToFund`
 * @returns {number} - the amount of leftover change (in satoshis)
 * @private
 * @ignore
 */
export function addUTXOsToFund(txBuilderIn: TransactionBuilder,
                               utxos: Array<UTXO>,
                               amountToFund: number, feeRate: number,
                               fundNewFees: boolean = true): number {
  if (utxos.length === 0) {
    throw new NotEnoughFundsError(amountToFund)
  }

  // how much are we increasing fees by adding an input ?
  const newFees = feeRate * (estimateTXBytes(txBuilderIn, 1, 0)
                             - estimateTXBytes(txBuilderIn, 0, 0))
  let utxoThreshhold = amountToFund
  if (fundNewFees) {
    utxoThreshhold += newFees
  }

  const goodUtxos = utxos.filter(utxo => utxo.value >= utxoThreshhold)
  if (goodUtxos.length > 0) {
    goodUtxos.sort((a, b) => a.value - b.value)
    const selected = goodUtxos[0]
    let change = selected.value - amountToFund
    if (fundNewFees) {
      change -= newFees
    }

    txBuilderIn.addInput(selected.tx_hash, selected.tx_output_n)
    return change
  } else {
    utxos.sort((a, b) => b.value - a.value)
    const largest = utxos[0]

    if (newFees >= largest.value) {
      throw new NotEnoughFundsError(amountToFund)
    }

    txBuilderIn.addInput(largest.tx_hash, largest.tx_output_n)

    let remainToFund = amountToFund - largest.value
    if (fundNewFees) {
      remainToFund += newFees
    }

    return addUTXOsToFund(txBuilderIn, utxos.slice(1),
                          remainToFund, feeRate, fundNewFees)
  }
}


export function signInputs(txB: TransactionBuilder,
                           defaultSigner: TransactionSigner,
                           otherSigners?: Array<{index: number, signer: TransactionSigner}>) {
  const txInner = getTransactionInsideBuilder(txB)
  const signerArray = txInner.ins.map(() => defaultSigner)
  if (otherSigners) {
    otherSigners.forEach((signerPair) => {
      signerArray[signerPair.index] = signerPair.signer
    })
  }
  let signingPromise = Promise.resolve()
  for (let i = 0; i < txInner.ins.length; i++) {
    signingPromise = signingPromise.then(
      () => signerArray[i].signTransaction(txB, i)
    )
  }
  return signingPromise.then(() => txB)
}
