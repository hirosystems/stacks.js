import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM, DEFAULT_BURN_ADDRESS,
         estimateTXBytes, sumOutputValues, hash160 } from './util'
import { makePreorderSkeleton, makeRegisterSkeleton,
         makeUpdateSkeleton, makeTransferSkeleton, makeRenewalSkeleton } from './skeletons'
import { BlockstackNetwork } from './network'

function addOwnerInput(utxos: Object,
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

function fundTransaction(txB: bitcoinjs.TransactionBuilder, paymentAddress: string,
                         utxos: Array<{value: number, tx_hash: string, tx_output_n: number}>,
                         feeRate: number, inAmounts: number, changeIndex: number | null = null) {
  // change index for the payer.
  if (changeIndex === null) {
    changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)
  }
  // fund the transaction fee.
  const txFee = estimateTXBytes(txB, 1, 0) * feeRate
  const outAmounts = sumOutputValues(txB)

  return addUTXOsToFund(txB, changeIndex, utxos,
                        txFee + outAmounts - inAmounts, feeRate)
}

function makeRenewal(fullyQualifiedName: string,
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
      const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                         ownerInput.value)

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


function makePreorder(fullyQualifiedName: string,
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
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1)

      const changeIndex = 1 // preorder skeleton always creates a change output at index = 1
      const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex)

      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}

function makeUpdate(fullyQualifiedName: string,
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
      const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                         ownerInput.value)

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

function makeRegister(fullyQualifiedName: string,
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

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const signingTxB = fundTransaction(txB, paymentAddress, utxos, feeRate, 0)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build()
    })
}

function makeTransfer(fullyQualifiedName: string,
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
      const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                         ownerInput.value)
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


export const transactions = {
  makeRenewal, makeUpdate, makePreorder, makeRegister, makeTransfer
}
