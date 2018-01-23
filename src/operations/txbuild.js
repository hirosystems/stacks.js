import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM,
         estimateTXBytes, sumOutputValues, hash160 } from './utils'
import { makePreorderSkeleton, makeRegisterSkeleton,
         makeUpdateSkeleton, makeTransferSkeleton, makeRenewalSkeleton } from './skeletons'
import { config } from '../config'
import { hexStringToECPair } from '../utils'

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
                     ownerKeyHex: string,
                     paymentKeyHex: string,
                     zonefile: string = null) {
  let valueHash = undefined
  const network = config.network

  if (!!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  }

  const namespace = fullyQualifiedName.split('.').pop()

  const ownerKey = hexStringToECPair(ownerKeyHex)
  const paymentKey = hexStringToECPair(paymentKeyHex)

  const ownerAddress = ownerKey.getAddress()
  const paymentAddress = paymentKey.getAddress()

  const txPromise = Promise.all([network.getNamePrice(fullyQualifiedName),
                                 network.getNamespaceBurnAddress(namespace)])
        .then(([namePrice, burnAddress]) =>
              makeRenewalSkeleton(
                fullyQualifiedName, destinationAddress, ownerAddress,
                burnAddress, namePrice, valueHash))
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
      return signingTxB.build().toHex()
    })
}

function estimatePreorder(fullyQualifiedName: string,
                          destinationAddress: string,
                          paymentHex: string,
                          inputUtxos: number = 1) : Promise<number> {
  const network = config.network

  const registerAddress = destinationAddress
  const paymentKey = hexStringToECPair(paymentHex)
  const preorderAddress = paymentKey.getAddress()

  const dummyBurnAddress   = '1111111111111111111114oLvT2'
  const dummyConsensusHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

  const preorderPromise = network.getNamePrice(fullyQualifiedName)
        .then(namePrice => makePreorderSkeleton(
          fullyQualifiedName, dummyConsensusHash, preorderAddress,
          dummyBurnAddress, namePrice, registerAddress))

  return Promise.all([network.getFeeRate(), preorderPromise])
    .then(([feeRate, preorderTX]) => {
      const outputsValue = sumOutputValues(preorderTX)
      const txFee = feeRate * estimateTXBytes(preorderTX, inputUtxos, 0)
      return txFee + outputsValue
    })
}

function makePreorder(fullyQualifiedName: string,
                      destinationAddress: string,
                      paymentKeyHex: string) {
  const network = config.network

  const namespace = fullyQualifiedName.split('.').pop()

  const registerAddress = destinationAddress
  const paymentKey = hexStringToECPair(paymentKeyHex)
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([network.getConsensusHash(),
                                       network.getNamePrice(fullyQualifiedName),
                                       network.getNamespaceBurnAddress(namespace)])
        .then(([consensusHash, namePrice, burnAddress]) =>
          makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, registerAddress))

  return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
    .then(([utxos, feeRate, preorderSkeleton]) => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1)

      const changeIndex = 1 // preorder skeleton always creates a change output at index = 1
      const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex)

      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build().toHex()
    })
}

function makeUpdate(fullyQualifiedName: string,
                    ownerKeyHex: string,
                    paymentKeyHex: string,
                    zonefile: string) {
  const network = config.network
  const valueHash = hash160(Buffer.from(zonefile)).toString('hex')

  const ownerKey = hexStringToECPair(ownerKeyHex)
  const paymentKey = hexStringToECPair(paymentKeyHex)

  const paymentAddress = paymentKey.getAddress()
  const ownerAddress = ownerKey.getAddress()

  const txPromise = network.getConsensusHash()
        .then((consensusHash) =>
              makeUpdateSkeleton(fullyQualifiedName, consensusHash, valueHash))
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
      return signingTxB.build().toHex()
    })
}

function makeRegister(fullyQualifiedName: string,
                             registerAddress: string,
                             paymentKeyHex: string,
                             zonefile: string = null) {
  const network = config.network
  let valueHash = undefined
  if (!!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  }

  const registerSkeleton = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, valueHash)

  const txB = bitcoinjs.TransactionBuilder.fromTransaction(registerSkeleton, network.layer1)
  const paymentKey = hexStringToECPair(paymentKeyHex)
  const paymentAddress = paymentKey.getAddress()

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const signingTxB = fundTransaction(txB, paymentAddress, utxos, feeRate, 0)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build().toHex()
    })
}

function makeTransfer(fullyQualifiedName: string,
                      destinationAddress: string,
                      ownerKeyHex: string,
                      paymentKeyHex: string) {
  const network = config.network
  const ownerKey = hexStringToECPair(ownerKeyHex)
  const paymentKey = hexStringToECPair(paymentKeyHex)
  const paymentAddress = paymentKey.getAddress()
  const ownerAddress = ownerKey.getAddress()

  const txPromise = network.getConsensusHash()
        .then((consensusHash) =>
              makeTransferSkeleton(fullyQualifiedName, consensusHash, destinationAddress))
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
      return signingTxB.build().toHex()
    })
}

export const transactions = {
  makeRenewal, makeUpdate, makePreorder, makeRegister, makeTransfer,
  estimatePreorder
}
