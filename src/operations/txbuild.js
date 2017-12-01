import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM, estimateTXBytes } from './util'
import { makePreorderSkeleton, makeRegisterSkeleton } from './skeletons'
import { BlockstackNetwork } from './network'

export function addOwnerInput(utxos: Object,
                              txIn: bitcoinjs.Transaction,
                              network: BlockstackNetwork) {
  const txB = bitcoinjs.TransactionBuilder.fromTransaction(txIn, network.layer1)
  utxos.sort((a, b) => a.value - b.value)
  const selected = utxos[0]
  txB.addInput(selected.tx_hash, selected.tx_output_n)
  return txB.buildIncomplete()
}

export function performPreorder(fullyQualifiedName: string,
                                destinationAddress: string,
                                paymentKey: bitcoinjs.ECPair,
                                network: BlockstackNetwork) {
  const burnAddress = network.coerceAddress('1111111111111111111114oLvT2')
  const registerAddress = destinationAddress
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([network.getConsensusHash(),
                                       network.getNamePrice(fullyQualifiedName)])
        .then(inputs => {
          const consensusHash = inputs[0]
          const namePrice = inputs[1]
          return makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, network, registerAddress)
        })

  return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
    .then(inputs => {
      const utxos = inputs[0]
      const feeRate = inputs[1]
      const preorderSkeleton = inputs[2]
      const txFee = estimateTXBytes(preorderSkeleton, 1, 0) * feeRate
      const outAmounts = preorderSkeleton.outs.reduce((agg, x) => agg + x.value, 0)

      return addUTXOsToFund(
        preorderSkeleton, preorderAddress, utxos, txFee + outAmounts, feeRate, network)
    })
    .then(unsignedTx => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(unsignedTx, network.layer1)
      for (let i = 0; i < txB.tx.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build()
    })
}

export function performRegister(fullyQualifiedName: string,
                                registerAddress: string,
                                paymentKey: bitcoinjs.ECPair,
                                network: BlockstackNetwork) {
  const registerSkeleton = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, registerAddress, network)

  const txB = bitcoinjs.TransactionBuilder.fromTransaction(registerSkeleton, network.layer1)
  const paymentAddress = paymentKey.getAddress()
  txB.addOutput(paymentAddress, DUST_MINIMUM) // change.

  const withChange = txB.buildIncomplete()

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(inputs => {
      const utxos = inputs[0]
      const feeRate = inputs[1]
      const txFee = estimateTXBytes(withChange, 1, 0) * feeRate
      const outAmounts = withChange.outs.reduce((agg, x) => agg + x.value, 0)

      return addUTXOsToFund(withChange, paymentAddress, utxos, txFee + outAmounts,
                            feeRate, network)
    })
    .then(unsignedTx => {
      const signingTxB = bitcoinjs.TransactionBuilder.fromTransaction(unsignedTx, network.layer1)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}
