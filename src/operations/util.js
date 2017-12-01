import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'
import RIPEMD160 from 'ripemd160'
import bigi from 'bigi'

const utxoProviderUrl = 'https://blockchain.info/unspent?format=json&active='
// const blockstackAPIUrl = 'https://core.blockstack.org'
const blockstackAPIUrl = 'http://localhost:16268'
export const DUST_MINIMUM = 5500
export const SATOSHIS_PER_BTC = 1e8

export function getUTXOsMain(address: string) {
  // sigh. for regtest, this is going to be weird.
  //   either, we write a driver kit for plugging into
  //   different backends (I do not like.) or we assume
  //   an API for the UTXO provider, and stand-up a simple
  //   wrapper daemon for regtest / local bitcoind comms.
  return fetch(`${utxoProviderUrl}${address}`)
    .then(resp => resp.json())
}

export function getUTXOs(address: string) {
  const jsonRPCImport = { jsonrpc: '1.0',
                          method: 'importaddress',
                          params: [address] }
  const jsonRPCUnspent = { jsonrpc: '1.0',
                           method: 'listunspent',
                           params: [1, 9999999, [address]] }
  const fetchURL = 'http://blockstack:blockstacksystem@127.0.0.1:18332/'

  return fetch(fetchURL, { method: 'POST', body: JSON.stringify(jsonRPCImport) })
    .then(() => fetch(fetchURL, { method: 'POST', body: JSON.stringify(jsonRPCUnspent) }))
    .then(resp => resp.json())
    .then(x => x.result)
    .then(utxos => utxos.map(
      x => Object({ value: x.amount * SATOSHIS_PER_BTC,
                    confirmations: x.confirmations,
                    tx_hash: x.txid,
                    tx_output_n: x.vout })))
}

export function coerceAddress(address: string, network: Object) {
  const addressHash = bitcoinjs.address.fromBase58Check(address).hash
  return bitcoinjs.address.toBase58Check(addressHash, network.pubKeyHash)
}

export function getNamePrice(fullyQualifiedName: string) {
  return fetch(`${blockstackAPIUrl}/v1/prices/names/${fullyQualifiedName}`)
    .then(resp => resp.json())
    .then(x => x.name_price.satoshis)
}

export function getFeeRateMainnet() {
}

export function getFeeRate() {
  return 0.00001000 * SATOSHIS_PER_BTC
}

export function getConsensusHash() {
  return fetch(`${blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
    .then(resp => resp.json())
    .then(x => x.consensus_hash)
}

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

export function countDustOutputs() {

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
                        amountToFund: number, feeRate: number, network: Object) {
  const txB = bitcoinjs.TransactionBuilder.fromTransaction(txIn, network)

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
          return bitcoinjs.address.fromOutputScript(x.script, network)
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

    const newFees = feeRate * (estimateTXBytes(txIn, 2, 1) - estimateTXBytes(txIn, 1, 1))
    const remainToFund = amountToFund + newFees - largest.value

    return addUTXOsToFund(txB.buildIncomplete(),
                          funderAddress, utxos.slice(1),
                          remainToFund, feeRate, network)
  }
}
