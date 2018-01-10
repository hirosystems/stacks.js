import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM, DEFAULT_BURN_ADDRESS,
         estimateTXBytes, sumOutputValues, hash160 } from './util'
import { makePreorderSkeleton, makeRegisterSkeleton,
         makeUpdateSkeleton, makeTransferSkeleton, makeRenewalSkeleton } from './skeletons'
import { BlockstackNetwork } from './network'

export function addOwnerInput(utxos: Object,
                              ownerAddress: string,
                              txB: bitcoinjs.TransactionBuilder,
                              addChangeOut: boolean = true) {
  // add an owner UTXO and a change out.
  if (utxos.length < 0) {
    throw new Error('Owner has no UTXOs for UPDATE.')
  }

  utxos.sort((a, b) => a.value - b.value)
  const ownerUTXO = utxos[0]
  const ownerInput = txB.addInput(ownerUTXO.tx_hash, ownerUTXO.tx_output_n)
  if (addChangeOut) {
    txB.addOutput(ownerAddress, ownerUTXO.value)
  }
  return { index: ownerInput, value: ownerUTXO.value }
}

export function makeRenewal(fullyQualifiedName: string,
                            destinationAddress: string,
                            ownerKey: bitcoinjs.ECPair,
                            paymentKey: bitcoinjs.ECPair,
                            network: BlockstackNetwork,
                            zonefile: string = null) {
  let valueHash = undefined
  if (!!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  }

  const burnAddress = network.coerceAddress(DEFAULT_BURN_ADDRESS)
  const ownerAddress = ownerKey.getAddress()
  const paymentAddress = paymentKey.getAddress()

  const txPromise = network.getNamePrice(fullyQualifiedName)
        .then((namePrice) =>
              makeRenewalSkeleton(
                fullyQualifiedName, destinationAddress, ownerAddress,
                burnAddress, namePrice, network, valueHash))
        .then((tx) => bitcoinjs.TransactionBuilder.fromTransaction(tx, network.layer1))

  return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                      network.getUTXOs(ownerAddress), network.getFeeRate()])
    .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
      const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB, false)
      // change index for the payer.
      const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

      // fund the transaction fee.
      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)
      const inAmounts = ownerInput.value // let the owner input fund its output

      const signingTxB = addUTXOsToFund(txB, changeIndex, payerUtxos,
                                        txFee + outAmounts - inAmounts, feeRate)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        if (i === ownerInput.index) {
          signingTxB.sign(i, ownerKey)
        } else {
          signingTxB.sign(i, paymentKey)
        }
      }
      return signingTxB.build()
    })
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
        .then(([consensusHash, namePrice]) =>
          makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, network, registerAddress))

  return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
    .then(([utxos, feeRate, preorderSkeleton]) => {
      const preorderSkeletonTxB = bitcoinjs.TransactionBuilder.fromTransaction(
        preorderSkeleton, network.layer1)

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
    .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
      const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB)
      // change index for the payer.
      const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

      // fund the transaction fee.
      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)
      const inAmounts = ownerInput.value // let the owner input fund its output

      const signingTxB = addUTXOsToFund(txB, changeIndex, payerUtxos,
                                        txFee + outAmounts - inAmounts, feeRate)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        if (i === ownerInput.index) {
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
    fullyQualifiedName, registerAddress, network, valueHash)

  const txB = bitcoinjs.TransactionBuilder.fromTransaction(registerSkeleton, network.layer1)
  const paymentAddress = paymentKey.getAddress()
  const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)

      const signingTxB = addUTXOsToFund(txB, changeIndex, utxos, txFee + outAmounts)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}

export function makeTransfer(fullyQualifiedName: string,
                             destinationAddress: string,
                             ownerKey: bitcoinjs.ECPair,
                             paymentKey: bitcoinjs.ECPair,
                             network: BlockstackNetwork) {
  const paymentAddress = paymentKey.getAddress()
  const ownerAddress = ownerKey.getAddress()

  const txPromise = network.getConsensusHash()
        .then((consensusHash) =>
              makeTransferSkeleton(fullyQualifiedName, consensusHash, destinationAddress, network))
        .then((transferTX) =>
              bitcoinjs.TransactionBuilder.fromTransaction(transferTX, network.layer1))

  return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                      network.getUTXOs(ownerAddress), network.getFeeRate()])
    .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
      const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB)
      // change index for the payer
      const changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)

      // fund the transaction fee
      const txFee = estimateTXBytes(txB, 1, 0) * feeRate
      const outAmounts = sumOutputValues(txB)
      const inAmounts = ownerInput.value // let the owner input fund its output

      const signingTxB = addUTXOsToFund(txB, changeIndex, payerUtxos,
                                        txFee + outAmounts - inAmounts, feeRate)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        if (i === ownerInput.index) {
          signingTxB.sign(i, ownerKey)
        } else {
          signingTxB.sign(i, paymentKey)
        }
      }
      return signingTxB.build()
    })
}
