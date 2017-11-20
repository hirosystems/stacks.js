import bitcoinjs from 'bitcoinjs-lib'
import coinSelectUtils from 'coinselect/utils'

import { makePreorderSkeleton } from './skeletons'

function addOwnerInput(utxos: Object,
                       txIn: bitcoinjs.Transaction) {
  let txBuilder = TransactionBuilder.fromTransaction(txIn)
  utxos.sort( (a, b) => a.value - b.value )
  const selected = utxos[0]
  txBuilder.addInput(selected.tx_hash, selected.tx_output_n)
  return txBuilder.buildIncomplete()
}

function makeEphemeralKey() {
  return bitcoinjs.ECPair.makeRandom()
}

const DUST_MINIMUM = 5500

function performPreorder(fullyQualifiedName: string,
                         destinationAddress: string,
                         paymentKey: ECPair) {
  const burnAddress = '1111111111111111111114oLvT2'
  const registerAddress = destinationAddress
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([getConsensusHash(), getNamePrice(fullyQualifiedName) ])
        .then(inputs => {
          const consensusHash = inputs[0]
          const namePrice = inputs[1]
          return makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, registerAddress)
        })

  return Promise.all([getUTXOs(preorderAddress), getFeeRate(), preorderPromise])
    .then(inputs => {
      const utxos = inputs[0]
      const feeRate = inputs[1]
      const preorderSkeleton = inputs[2]
      const txFee = estimateTXBytes(preorderSkeleton, 1, 0) * feeRate
      const outAmounts = preorderSkeleton.outs.reduce( (agg, x) => agg + x.value )

      return addUTXOsToFund(
        preorderSkeleton, preorderAddress, utxos, txFee + outAmounts, feeRate)
    })
    .then(unsignedTx => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(unsignedTx)
      for (let i = 0; i < txB.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build()
    })
}

exports.makeEphemeralKey = makeEphemeralKey
exports.performPreorder = performPreorder

