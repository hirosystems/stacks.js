import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'

const utxoProviderUrl = 'https://blockchain.info/unspent?format=json&active='
const blockstackAPIUrl = 'https://core.blockstack.org'

function getUTXOs(address: string) {
  return fetch(`${utxoProverUrl}${address}`)
    .then(resp => resp.json())
}

function getConsensusHash() {
  return fetch(`${blockstackAPIUrl}/v1/blockchains/bitcoin/consensus`)
    .then(resp => resp.json().consensus_hash)
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
  let txBuilder = TransactionBuilder.fromTransaction(txIn)

  if (utxos.length == 0 ) {
    throw new Error('Not enough UTXOs to fund')
  }

  let goodUtxos = utxos.filter( utxo => utxo.value >= amountToFund )
  let tx = txIn.clone()
  if (goodUtxos.length > 0) {
    goodUtxos.sort( (a, b) => a.value - b.value )
    const selected = goodUtxos[0]
    const change = selected.value - amountToFund
    const changeOutput = txBuilder.outs.find( x => x.address == funderAddress )
    if (changeOutput) {
      changeOutput.value += change
    }
    txBuilder.addInput(selected.tx_hash, selected.tx_output_n)
    return txBuilder.buildIncomplete()
  } else {
    utxos.sort( (a, b) => b.value - a.value )
    const largest = utxos[0]

    txBuilder.addInput(largest.tx_hash, largest.tx_output_n)

    const newFees = feeRate * (estimateTXBytes(txIn, 2, 1) - estimateTXBytes(txIn, 1, 0))
    const remainToFund = amountToFund + newFees - largest.value

    return addUTXOsToFund(txBuilder.buildIncomplete(),
                          funderAddress, utxos.slice(1),
                          remainToFund, feeRate)
  }
}
