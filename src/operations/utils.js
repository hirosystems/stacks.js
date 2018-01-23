import bitcoinjs from 'bitcoinjs-lib'
import RIPEMD160 from 'ripemd160'
import bigi from 'bigi'

export const DUST_MINIMUM = 5500

export function hash160(buff: Buffer) {
  const sha256 = bitcoinjs.crypto.sha256(buff)
  return (new RIPEMD160()).update(sha256).digest()
}

export function hash128(buff: Buffer) {
  return Buffer.from(bitcoinjs.crypto.sha256(buff).slice(0, 16))
}


// COPIED FROM coinselect, because 1 byte matters sometimes.
// baseline estimates, used to improve performance
const TX_EMPTY_SIZE = 4 + 1 + 1 + 4
const TX_INPUT_BASE = 32 + 4 + 1 + 4
const TX_INPUT_PUBKEYHASH = 107
const TX_OUTPUT_BASE = 8 + 1
const TX_OUTPUT_PUBKEYHASH = 25

function inputBytes(input) {
  return TX_INPUT_BASE + (input.script ? input.script.length : TX_INPUT_PUBKEYHASH)
}

function outputBytes(output) {
  return TX_OUTPUT_BASE + (output.script ? output.script.length : TX_OUTPUT_PUBKEYHASH)
}

function transactionBytes(inputs, outputs) {
  return TX_EMPTY_SIZE +
    inputs.reduce((a, x) => (a + inputBytes(x)), 0) +
    outputs.reduce((a, x) => (a + outputBytes(x)), 0)
}

//

export function estimateTXBytes(txIn : bitcoinjs.Transaction | bitcoinjs.TransactionBuilder,
                                additionalInputs : number,
                                additionalOutputs : number) {
  let innerTx = txIn
  if (txIn instanceof bitcoinjs.TransactionBuilder) {
    innerTx = txIn.tx
  }
  const dummyInputs = new Array(additionalInputs)
  dummyInputs.fill(1)
  const dummyOutputs = new Array(additionalOutputs)
  dummyOutputs.fill(1)

  const inputs = [].concat(innerTx.ins, dummyInputs)
  const outputs = [].concat(innerTx.outs, dummyOutputs)

  return transactionBytes(inputs, outputs)
}

export function sumOutputValues(txIn : bitcoinjs.Transaction | bitcoinjs.TransactionBuilder) {
  let innerTx = txIn
  if (txIn instanceof bitcoinjs.TransactionBuilder) {
    innerTx = txIn.tx
  }

  return innerTx.outs.reduce((agg, x) => agg + x.value, 0)
}

export function decodeB40(input: string) {
  const characters = '0123456789abcdefghijklmnopqrstuvwxyz-_.+'
  const base = bigi.valueOf(40)
  return input.split('').reverse()
    .reduce((agg, character, exponent) =>
            agg.add(bigi.valueOf(characters.indexOf(character)).multiply(
              base.pow(bigi.valueOf(exponent)))),
            bigi.ZERO)
    .toHex()
}

export function addUTXOsToFund(txBuilderIn: bitcoinjs.TransactionBuilder, changeOutput: number,
                               utxos: Array<{value: number, tx_hash: string, tx_output_n: number}>,
                               amountToFund: number, feeRate: number) {
  // This will 100% mutate the provided txbuilder object.
  if (utxos.length === 0) {
    throw new Error(`Not enough UTXOs to fund. Left to fund: ${amountToFund}`)
  }

  const goodUtxos = utxos.filter(utxo => utxo.value >= amountToFund)
  if (goodUtxos.length > 0) {
    goodUtxos.sort((a, b) => a.value - b.value)
    const selected = goodUtxos[0]
    const change = selected.value - amountToFund

    txBuilderIn.tx.outs[changeOutput].value += change
    txBuilderIn.addInput(selected.tx_hash, selected.tx_output_n)
    return txBuilderIn
  } else {
    utxos.sort((a, b) => b.value - a.value)
    const largest = utxos[0]

    txBuilderIn.addInput(largest.tx_hash, largest.tx_output_n)

    const newFees = feeRate * (estimateTXBytes(txBuilderIn, 1, 0)
                               - estimateTXBytes(txBuilderIn, 0, 0))
    const remainToFund = amountToFund + newFees - largest.value

    return addUTXOsToFund(txBuilderIn,
                          changeOutput, utxos.slice(1),
                          remainToFund, feeRate)
  }
}
