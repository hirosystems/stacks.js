import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'
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

  return coinSelectUtils.transactionBytes(inputs, outputs)
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
