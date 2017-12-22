import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM, DEFAULT_BURN_ADDRESS,
         estimateTXBytes, sumOutputValues, hash160 } from './util'
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

export function makePreorder(fullyQualifiedName: string,
                             destinationAddress: string,
                             paymentKey: bitcoinjs.ECPair,
                             network: BlockstackNetwork) {
  const burnAddress = network.coerceAddress(DEFAULT_BURN_ADDRESS)
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

      const preorderSkeletonTxB = bitcoinjs.TransactionBuilder.fromTransaction(
        inputs[2], network.layer1)

      const txFee = estimateTXBytes(preorderSkeletonTxB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(preorderSkeletonTxB)
      const changeIndex = 1 // preorder skeleton always creates a change output at index = 1

      return addUTXOsToFund(
        preorderSkeletonTxB, changeIndex, utxos, txFee + outAmounts, feeRate, network)
    })
    .then(txB => {
      for (let i = 0; i < txB.tx.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build()
    })
}

export function makeRegister(fullyQualifiedName: string,
                             registerAddress: string,
                             paymentKey: bitcoinjs.ECPair,
                             zonefile: string = null,
                             network: BlockstackNetwork) {
  let valueHash = undefined
  if (!!zonefile) {
    valueHash = hash160(Buffer.from(zonefile))
  }

  const registerSkeleton = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, registerAddress, network, valueHash)

  const txB = bitcoinjs.TransactionBuilder.fromTransaction(registerSkeleton, network.layer1)
  const paymentAddress = paymentKey.getAddress()
  const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(inputs => {
      const utxos = inputs[0]
      const feeRate = inputs[1]

      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)

      return addUTXOsToFund(txB, changeIndex, utxos, txFee + outAmounts,
                            feeRate, network)
    })
    .then(signingTxB => {
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}
