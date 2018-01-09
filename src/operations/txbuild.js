import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM, DEFAULT_BURN_ADDRESS,
         estimateTXBytes, sumOutputValues, hash160 } from './util'
import { makePreorderSkeleton, makeRegisterSkeleton, makeUpdateSkeleton } from './skeletons'
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
        preorderSkeletonTxB, changeIndex, utxos, txFee + outAmounts, feeRate)
    })
    .then(txB => {
      for (let i = 0; i < txB.tx.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build()
    })
}

export function makeUpdate(fullyQualifiedName: string,
                           ownerKey: bitcoinjs.ECPair,
                           paymentKey: bitcoinjs.ECPair,
                           zonefile: string,
                           network: BlockstackNetwork) {
  const valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  const paymentAddress = paymentKey.getAddress()
  const ownerAddress = ownerKey.getAddress()

  const txPromise = network.getConsensusHash()
        .then((consensusHash) =>
              makeUpdateSkeleton(fullyQualifiedName, consensusHash, valueHash, network))
        .then((updateTX) => bitcoinjs.TransactionBuilder.fromTransaction(updateTX, network.layer1))

  return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                      network.getUTXOs(ownerAddress), network.getFeeRate()])
    .then((inputs) => {
      const txB = inputs[0]
      const payerUtxos = inputs[1]
      const ownerUtxos = inputs[2]
      const feeRate = inputs[3]


      // add an owner UTXO and change it back out.
      ownerUtxos.sort((a, b) => a.value - b.value)
      if (ownerUtxos.length < 0) {
        throw new Error('Owner has no UTXOs for UPDATE.')
      }
      const ownerUTXO = ownerUtxos[0]
      const ownerInput = txB.addInput(ownerUTXO.tx_hash, ownerUTXO.tx_output_n)
      txB.addOutput(ownerAddress, ownerUTXO.value)

      // change index for the payer.
      const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

      // fund the transaction fee.
      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)
      const inAmounts = ownerUTXO.value

      const signingTxB = addUTXOsToFund(txB, changeIndex, payerUtxos,
                                        txFee + outAmounts - inAmounts, feeRate)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        if (i === ownerInput) {
          signingTxB.sign(i, ownerKey)
        } else {
          signingTxB.sign(i, paymentKey)
        }
      }
      return signingTxB.build()
    })
}

export function makeRegister(fullyQualifiedName: string,
                             registerAddress: string,
                             paymentKey: bitcoinjs.ECPair,
                             zonefile: string = null,
                             network: BlockstackNetwork) {
  let valueHash = undefined
  if (!!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
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

      return addUTXOsToFund(txB, changeIndex, utxos, txFee + outAmounts)
    })
    .then(signingTxB => {
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}
