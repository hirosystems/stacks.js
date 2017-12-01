import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'
import RIPEMD160 from 'ripemd160'
import bigi from 'bigi'
import { BlockstackNetwork } from './network'

export const DUST_MINIMUM = 5500
export const SATOSHIS_PER_BTC = 1e8

export function hash160(buff: Buffer) {
  const sha256 = bitcoinjs.crypto.sha256(buff)
  return (new RIPEMD160()).update(sha256).digest()
}

export function hash128(buff: Buffer) {
  return Buffer.from(bitcoinjs.crypto.sha256(buff).slice(0, 16))
}

export function estimateTXBytes(txIn : bitcoinjs.Transaction, additionalInputs : number,
                                additionalOutputs : number) {
  const inputs = [].concat(txIn.ins, new Array(additionalInputs))
  const outputs = [].concat(txIn.outs, new Array(additionalOutputs))
  return coinSelectUtils.transactionBytes(inputs, outputs)
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

export function addUTXOsToFund(txIn: bitcoinjs.Transaction, funderAddress: string, utxos: Object,
                               amountToFund: number, feeRate: number, network: BlockstackNetwork) {
  const txB = bitcoinjs.TransactionBuilder.fromTransaction(txIn, network.layer1)

  if (utxos.length === 0) {
    throw new Error(`Not enough UTXOs for ${funderAddress} to fund: left to fund: ${amountToFund}`)
  }

  const goodUtxos = utxos.filter(utxo => utxo.value >= amountToFund)
  if (goodUtxos.length > 0) {
    goodUtxos.sort((a, b) => a.value - b.value)
    const selected = goodUtxos[0]
    const change = selected.value - amountToFund
    const outputAddresses = txB.tx.outs.map(
      x => {
        if (bitcoinjs.script.toASM(x.script).startsWith('OP_RETURN')) {
          return ''
        } else {
          return bitcoinjs.address.fromOutputScript(x.script, network.layer1)
        }
      })
    const changeOutput = outputAddresses.indexOf(funderAddress)
    if (changeOutput !== -1) {
      txB.tx.outs[changeOutput].value += change
    } else {
      throw new Error('Couldn\'t find a change output')
    }
    txB.addInput(selected.tx_hash, selected.tx_output_n)
    return txB.buildIncomplete()
  } else {
    utxos.sort((a, b) => b.value - a.value)
    const largest = utxos[0]

    txB.addInput(largest.tx_hash, largest.tx_output_n)

    const newFees = feeRate * (estimateTXBytes(txIn, 1, 0) - estimateTXBytes(txIn, 0, 0))
    const remainToFund = amountToFund + newFees - largest.value

    return addUTXOsToFund(txB.buildIncomplete(),
                          funderAddress, utxos.slice(1),
                          remainToFund, feeRate, network)
  }
}
