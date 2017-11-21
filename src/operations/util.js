import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'
import RIPEMD160 from 'ripemd160'

const utxoProviderUrl = 'https://blockchain.info/unspent?format=json&active='
const blockstackAPIUrl = 'https://core.blockstack.org'
const DUST_MINIMUM = 5500

function getUTXOs(address: string) {
  return fetch(`${utxoProviderUrl}${address}`)
    .then(resp => resp.json())
}

function getConsensusHash() {
  return fetch(`${blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
    .then(resp => resp.json().consensus_hash)
}

function hash160(buff: Buffer) {
  const sha256 = bitcoinjs.crypto.sha256(buff)
  return (new RIPEMD160()).update(sha256).digest()
}

function hash128(buff: Buffer) {
  return Buffer.from(bitcoinjs.crypto.sha256(buff).slice(0, 16))
}

function estimateTXBytes(txIn : bitcoinjs.Transaction,
                         additionalInputs : number, additionalOutputs : number) {
  const inputs = [].concat(txIn.ins, new Array(additionalInputs))
  const outputs = [].concat(txIn.outs, new Array(additionalOutputs))
  return coinSelectUtils.transactionBytes(inputs, outputs)
}

function countDustOutputs() {

}

function addUTXOsToFund(txIn: bitcoinjs.Transaction,
                        funderAddress: string,
                        utxos: Object,
                        amountToFund: number,
                        feeRate: number) {
  const txB = bitcoinjs.TransactionBuilder.fromTransaction(txIn)

  if (utxos.length === 0) {
    throw new Error('Not enough UTXOs to fund')
  }

  const goodUtxos = utxos.filter(utxo => utxo.value >= amountToFund)
  if (goodUtxos.length > 0) {
    goodUtxos.sort((a, b) => a.value - b.value)
    const selected = goodUtxos[0]
    const change = selected.value - amountToFund
    const changeOutput = txB.outs.find(x => x.address === funderAddress)
    if (changeOutput) {
      changeOutput.value += change
    }
    txB.addInput(selected.tx_hash, selected.tx_output_n)
    return txB.buildIncomplete()
  } else {
    utxos.sort((a, b) => b.value - a.value)
    const largest = utxos[0]

    txB.addInput(largest.tx_hash, largest.tx_output_n)

    const newFees = feeRate * (estimateTXBytes(txIn, 2, 1) - estimateTXBytes(txIn, 1, 0))
    const remainToFund = amountToFund + newFees - largest.value

    return addUTXOsToFund(txB.buildIncomplete(),
                          funderAddress, utxos.slice(1),
                          remainToFund, feeRate)
  }
}


exports = {
  addUTXOsToFund,
  countDustOutputs,
  getConsensusHash,
  hash160, hash128,
  DUST_MINIMUM, getUTXOs,
  estimateTXBytes }
