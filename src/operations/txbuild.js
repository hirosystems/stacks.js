import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, getConsensusHash, getUTXOs,
         estimateTXBytes, getFeeRate, getNamePrice } from './util'
import { makePreorderSkeleton } from './skeletons'

function addOwnerInput(utxos: Object,
                       txIn: bitcoinjs.Transaction,
                       network: Object) {
  const txB = bitcoinjs.TransactionBuilder.fromTransaction(txIn)
  utxos.sort((a, b) => a.value - b.value)
  const selected = utxos[0]
  txB.addInput(selected.tx_hash, selected.tx_output_n)
  return txB.buildIncomplete()
}

function makeEphemeralKey() {
  return bitcoinjs.ECPair.makeRandom()
}

function performPreorder(fullyQualifiedName: string,
                         destinationAddress: string,
                         paymentKey: bitcoinjs.ECPair,
                         network: Object = bitcoinjs.network.mainnet) {
  const burnAddress = '1111111111111111111114oLvT2'
  const registerAddress = destinationAddress
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([getConsensusHash(), getNamePrice(fullyQualifiedName)])
        .then(inputs => {
          const consensusHash = inputs[0]
          const namePrice = inputs[1]
          return makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, registerAddress, network)
        })

  return Promise.all([getUTXOs(preorderAddress), getFeeRate(), preorderPromise])
    .then(inputs => {
      const utxos = inputs[0]
      const feeRate = inputs[1]
      const preorderSkeleton = inputs[2]
      const txFee = estimateTXBytes(preorderSkeleton, 1, 0) * feeRate
      const outAmounts = preorderSkeleton.outs.reduce((agg, x) => agg + x.value)

      return addUTXOsToFund(
        preorderSkeleton, preorderAddress, utxos, txFee + outAmounts, feeRate, network)
    })
    .then(unsignedTx => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(unsignedTx, network)
      for (let i = 0; i < txB.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build()
    })
}

exports = { makeEphemeralKey, performPreorder, addOwnerInput }

