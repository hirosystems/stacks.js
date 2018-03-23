/* @flow */

import bitcoinjs from 'bitcoinjs-lib'

import { addUTXOsToFund, DUST_MINIMUM,
         estimateTXBytes, sumOutputValues, hash160 } from './utils'
import { makePreorderSkeleton, makeRegisterSkeleton,
         makeUpdateSkeleton, makeTransferSkeleton, makeRenewalSkeleton,
         makeRevokeSkeleton, makeNamespacePreorderSkeleton,
         makeNamespaceRevealSkeleton, makeNamespaceReadySkeleton,
         BlockstackNamespace } from './skeletons'
import { config } from '../config'
import { hexStringToECPair } from '../utils'
import { InvalidAmountError, InvalidParameterError } from '../errors'

const dummyBurnAddress   = '1111111111111111111114oLvT2'
const dummyConsensusHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const dummyZonefileHash  = 'ffffffffffffffffffffffffffffffffffffffff'

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
  const txFee = estimateTXBytes(txB, 0, 0) * feeRate
  const outAmounts = sumOutputValues(txB)
  const change = addUTXOsToFund(txB, utxos, txFee + outAmounts - inAmounts, feeRate)
  txB.tx.outs[changeIndex].value += change
  return txB
}

/**
 * Estimates cost of a preorder transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to preorder
 * @param {String} destinationAddress - the address to receive the name (this
 *    must be passed as the 'registrationAddress' in the register transaction)
 * @param {String} paymentAddress - the address funding the preorder
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the preorder. This includes a 5500 satoshi dust output for the preorder.
 *    Even though this is a change output, the payer must supply enough funds
 *    to generate this output, so we include it in the cost.
 * @private
 */
function estimatePreorder(fullyQualifiedName: string,
                          destinationAddress: string,
                          paymentAddress: string,
                          paymentUtxos: number = 1) : Promise<number> {
  const network = config.network
  const preorderPromise = network.getNamePrice(fullyQualifiedName)
        .then(namePrice => makePreorderSkeleton(
          fullyQualifiedName, dummyConsensusHash, network.coerceAddress(paymentAddress),
          network.coerceAddress(dummyBurnAddress), namePrice, 
          network.coerceAddress(destinationAddress)))

  return Promise.all([network.getFeeRate(), preorderPromise])
    .then(([feeRate, preorderTX]) => {
      const outputsValue = sumOutputValues(preorderTX)
      const txFee = feeRate * estimateTXBytes(preorderTX, paymentUtxos, 0)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of a register transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to register
 * @param {String} registerAddress - the address to receive the name
 * @param {String} paymentAddress - the address funding the register
 * @param {Boolean} includingZonefile - whether or not we will broadcast
 *    a zonefile hash as part  of the register
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the register.
 * @private
 */
function estimateRegister(fullyQualifiedName: string,
                          registerAddress: string,
                          paymentAddress: string,
                          includingZonefile: boolean = false,
                          paymentUtxos: number = 1) : Promise<number> {
  const network = config.network

  let valueHash = undefined
  if (includingZonefile) {
    valueHash = dummyZonefileHash
  }

  const registerTX = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, valueHash)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(registerTX)
      // 1 additional output for payer change
      const txFee = feeRate * estimateTXBytes(registerTX, paymentUtxos, 1)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of an update transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to update
 * @param {String} ownerAddress - the owner of the name
 * @param {String} paymentAddress - the address funding the update
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the update.
 * @private
 */
function estimateUpdate(fullyQualifiedName: string,
                        ownerAddress: string,
                        paymentAddress: string,
                        paymentUtxos: number = 1) : Promise<number> {
  const network = config.network

  const updateTX = makeUpdateSkeleton(
    fullyQualifiedName, dummyConsensusHash, dummyZonefileHash)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(updateTX)
      // 1 additional input for the owner
      // 2 additional outputs for owner / payer change
      const txFee = feeRate * estimateTXBytes(updateTX, 1 + paymentUtxos, 2)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of an transfer transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to transfer
 * @param {String} destinationAddress - the next owner of the name
 * @param {String} ownerAddress - the current owner of the name
 * @param {String} paymentAddress - the address funding the transfer
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the transfer.
 * @private
 */
function estimateTransfer(fullyQualifiedName: string,
                          destinationAddress: string,
                          ownerAddress: string,
                          paymentAddress: string,
                          paymentUtxos: number = 1) : Promise<number> {
  const network = config.network

  const transferTX = makeTransferSkeleton(fullyQualifiedName, dummyConsensusHash,
                                          destinationAddress)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(transferTX)
      // 1 additional input for the owner
      // 2 additional outputs for owner / payer change
      const txFee = feeRate * estimateTXBytes(transferTX, 1 + paymentUtxos, 2)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of an transfer transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to renew
 * @param {String} destinationAddress - the next owner of the name
 * @param {String} ownerAddress - the current owner of the name
 * @param {String} paymentAddress - the address funding the transfer
 * @param {Boolean} includingZonefile - whether or not we will broadcast a zonefile hash
      in the renewal operation
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the transfer.
 * @private
 */
function estimateRenewal(fullyQualifiedName: string,
                         destinationAddress: string,
                         ownerAddress: string,
                         paymentAddress: string,
                         includingZonefile: boolean = false,
                         paymentUtxos: number = 1) : Promise<number> {
  const network = config.network

  let valueHash = undefined
  if (includingZonefile) {
    valueHash = dummyZonefileHash
  }

  const renewalPromise = network.getNamePrice(fullyQualifiedName)
        .then((namePrice) => makeRenewalSkeleton(
          fullyQualifiedName, destinationAddress, ownerAddress,
          network.coerceAddress(dummyBurnAddress), namePrice, valueHash))

  return Promise.all([network.getFeeRate(), renewalPromise])
    .then(([feeRate, renewalTX]) => {
      const outputsValue = sumOutputValues(renewalTX)
      // 1 additional input for the owner
      // and renewal skeleton includes all outputs for owner change, but not for payer change.
      const txFee = feeRate * estimateTXBytes(renewalTX, 1 + paymentUtxos, 1)
      return txFee + outputsValue - 5500 // don't count the dust change for old owner.
    })
}

/**
 * Estimates cost of a revoke transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to revoke
 * @param {String} ownerAddress - the current owner of the name
 * @param {String} paymentAddress  the address funding the revoke
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund the
 *    revoke.
 * @private
 */
function estimateRevoke(fullyQualifiedName: string,
                        ownerAddress: string,
                        paymentAddress: string,
                        paymentUtxos: number = 1) : Promise<number>  {
  const network = config.network
  const revokeTX = makeRevokeSkeleton(fullyQualifiedName)

  return Promise.all([network.getFeeRate()])
    .then(([feeRate]) => {
      const outputsValue = sumOutputValues(revokeTX)
      // 1 additional input for owner
      // 1 additional output for payer change
      const txFee = feeRate * estimateTXBytes(revokeTX, 1 + paymentUtxos, 2)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of a namespace preorder transaction for a namespace
 * @param {String} namespaceID - the namespace to preorder
 * @param {String} revealAddress - the address to receive the namespace (this
 *    must be passed as the 'revealAddress' in the namespace-reveal transaction)
 * @param {String} paymentAddress - the address funding the preorder
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address.
 * @returns {Promise} - a promise which resolves to the satoshi cost to fund
 *    the preorder. This includes a 5500 satoshi dust output for the preorder.
 *    Even though this is a change output, the payer must supply enough funds
 *    to generate this output, so we include it in the cost.
 * @private
 */
function estimateNamespacePreorder(namespaceID: string,
                                   revealAddress: string,
                                   paymentAddress: string,
                                   paymentUtxos: number = 1) : Promise<number> {
  const network = config.network

  const preorderPromise = network.getNamespacePrice(namespaceID)
        .then(namespacePrice => makeNamespacePreorderSkeleton(
          namespaceID, dummyConsensusHash, 
          network.coerceAddress(paymentAddress),
          network.coerceAddress(revealAddress), namespacePrice))

  return Promise.all([network.getFeeRate(), preorderPromise])
    .then(([feeRate, preorderTX]) => {
      const outputsValue = sumOutputValues(preorderTX)
      const txFee = feeRate * estimateTXBytes(preorderTX, paymentUtxos, 0)
      return txFee + outputsValue
    })
}

/**
 * Estimates cost of a namesapce reveal transaction for a namespace
 * @param {BlockstackNamespace} namespace - the namespace to reveal
 * @param {String} revealAddress - the address to receive the namespace
 *    (this must have been passed as 'revealAddress' to a prior namespace
 *    preorder)
 * @param {String} paymentAddress - the address that pays for this transaction
 * @param {Number} paymentUtxos - the number of UTXOs we expect will be required
 *    from the payment address
 * @returns {Promise} - a promise which resolves to the satoshi cost to 
 *    fund the reveal.  This includes a 5500 satoshi dust output for the
 *    preorder.  Even though this is a change output, the payer must have
 *    enough funds to generate this output, so we include it in the cost.
 */
function estimateNamespaceReveal(namespace: BlockstackNamespace,
                                 revealAddress: string,
                                 paymentAddress: string,
                                 paymentUtxos: number = 1) : Promise<number> {
  const network = config.network
  const revealTX = makeNamespaceRevealSkeleton(namespace, revealAddress)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(revealTX)
      // 1 additional output for payer change
      const txFee = feeRate * estimateTXBytes(revealTX, paymentUtxos, 1)
      return txFee + outputsValue
    })
}

/**
 * Estimates the cost of a namespace-ready transaction for a namespace
 * @param {String} namespaceID - the namespace to ready
 * @param {Number} revealUtxos - the number of UTXOs we expect will
 *  be required from the reveal address
 * @returns {Promise} - a promise which resolves to the satoshi cost to
 *  fund this ready transaction.
 */
function estimateNamespaceReady(namespaceID: string,
                                revealUtxos: number = 1) : Promise<number> {
  const network = config.network
  const readyTX = makeNamespaceReadySkeleton(namespaceID)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(readyTX)
      const txFee = feeRate * estimateTXBytes(readyTX, revealUtxos, 1)
      return txFee + outputsValue
    })
}

/**
 * Generates a preorder transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to pre-order
 * @param {String} destinationAddress - the address to receive the name (this
 *    must be passed as the 'registrationAddress' in the register transaction)
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makePreorder(fullyQualifiedName: string,
                      destinationAddress: string,
                      paymentKeyHex: string) {
  const network = config.network

  const namespace = fullyQualifiedName.split('.').pop()

  const paymentKey = hexStringToECPair(paymentKeyHex)
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([network.getConsensusHash(),
                                       network.getNamePrice(fullyQualifiedName),
                                       network.getNamespaceBurnAddress(namespace)])
        .then(([consensusHash, namePrice, burnAddress]) =>
          makePreorderSkeleton(
            fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
            namePrice, destinationAddress))

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

/**
 * Generates an update transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to update
 * @param {String} ownerKeyHex - a hex string of the owner key. this will
 *    provide one UTXO input, and also recieve a dust output.
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the transaction's txfees
 * @param {String} zonefile - the zonefile data to update (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the UPDATE propagates.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
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

/**
 * Generates a register transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to register
 * @param {String} registerAddress - the address to receive the name (this
 *    must have been passed as the 'destinationAddress' in the preorder transaction)
 *    this address will receive a dust UTXO
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the transaction  (this *must* be the same as the payment
 *    address used to fund the preorder)
 * @param {String} zonefile - the zonefile data to include (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the UPDATE propagates.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRegister(fullyQualifiedName: string,
                      registerAddress: string,
                      paymentKeyHex: string,
                      zonefile: ?string = null) {
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

/**
 * Generates a transfer transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to transfer
 * @param {String} destinationAddress - the address to receive the name.
 *    this address will receive a dust UTXO
 * @param {String} ownerKeyHex - a hex string of the current owner's
 *    private key
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
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

/**
 * Generates a revoke transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to revoke
 * @param {String} ownerKeyHex - a hex string of the current owner's
 *    private key
 * @param {String} paymentKeyHex - a hex string of the private key used to 
 *    fund the transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRevoke(fullyQualifiedName: string,
                    ownerKeyHex: string,
                    paymentKeyHex: string) {
  const network = config.network
  const ownerKey = hexStringToECPair(ownerKeyHex)
  const paymentKey = hexStringToECPair(paymentKeyHex)
  const paymentAddress = paymentKey.getAddress()
  const ownerAddress = ownerKey.getAddress()
  
  const revokeTX = makeRevokeSkeleton(fullyQualifiedName)

  const txPromise = bitcoinjs.TransactionBuilder.fromTransaction(revokeTX, network.layer1)

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

/**
 * Generates a transfer transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to transfer
 * @param {String} destinationAddress - the address to receive the name after renewal
 *    this address will receive a dust UTXO
 * @param {String} ownerKeyHex - a hex string of the current owner's
 *    private key
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the renewal
 * @param {String} zonefile - the zonefile data to include (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the RENEWAL propagates.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRenewal(fullyQualifiedName: string,
                     destinationAddress: string,
                     ownerKeyHex: string,
                     paymentKeyHex: string,
                     zonefile: ?string = null) {
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
      const ownerOutput = txB.tx.outs[2]
      const ownerOutputAddr = bitcoinjs.address.fromOutputScript(
        ownerOutput.script, network.layer1)
      if (ownerOutputAddr !== ownerAddress) {
        throw new Error(`Original owner ${ownerAddress} should have an output at ` +
                        `index 2 in transaction was ${ownerOutputAddr}`)
      }
      ownerOutput.value = ownerInput.value
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


/**
 * Generates a namespace preorder transaction for a namespace
 * @param {String} namespaceID - the namespace to pre-order
 * @param {String} revealAddress - the address to receive the namespace (this
 *    must be passed as the 'revealAddress' in the namespace-reveal transaction)
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeNamespacePreorder(namespaceID: string,
                               revealAddress: string,
                               paymentKeyHex: string) {
  const network = config.network

  const paymentKey = hexStringToECPair(paymentKeyHex)
  const preorderAddress = paymentKey.getAddress()

  const preorderPromise = Promise.all([network.getConsensusHash(),
                                       network.getNamespacePrice(namespaceID)])
        .then(([consensusHash, namespacePrice]) =>
          makeNamespacePreorderSkeleton(
            namespaceID, consensusHash,
            network.coerceAddress(preorderAddress),
            network.coerceAddress(revealAddress), namespacePrice))

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


/**
 * Generates a namespace reveal transaction for a namespace
 * @param {BlockstackNamespace} namespace - the namespace to reveal
 * @param {String} revealAddress - the address to receive the namespace (this 
 *   must be passed as the 'revealAddress' in the namespace-reveal transaction)
 * @param {String} paymentKeyHex - a hex string of the private key used to fund
 *   the transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *   this function *does not* perform the requisite safety checks -- please see
 *   the safety module for those.
 * @private
 */
function makeNamespaceReveal(namespace: BlockstackNamespace,
                             revealAddress: string,
                             paymentKeyHex: string) {
  const network = config.network

  if (!namespace.check()) {
    throw new Error('Invalid namespace')
  }

  const paymentKey = hexStringToECPair(paymentKeyHex)
  const preorderAddress = paymentKey.getAddress()
  const namespaceRevealTX = makeNamespaceRevealSkeleton(namespace, revealAddress)

  return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(namespaceRevealTX, network.layer1)
      const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, paymentKey)
      }
      return signingTxB.build().toHex()
    })
} 


/**
 * Generates a namespace ready transaction for a namespace
 * @param {String} namespaceID - the namespace to launch
 * @param {String} revealKeyHex - the private key of the 'revealAddress' used
 *  to reveal the namespace.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *  this function *does not* perform the requisite safety checks -- please see
 *  the safety module for those.
 * @private
 */
function makeNamespaceReady(namespaceID: string,
                            revealKeyHex: string) {
  const network = config.network

  const revealKey = hexStringToECPair(revealKeyHex)
  const revealAddress = revealKey.getAddress()
  const namespaceReadyTX = makeNamespaceReadySkeleton(namespaceID)

  return Promise.all([network.getUTXOs(revealAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const txB = bitcoinjs.TransactionBuilder.fromTransaction(namespaceReadyTX, network.layer1)
      const signingTxB = fundTransaction(txB, revealAddress, utxos, feeRate, 0)
      for (let i = 0; i < signingTxB.tx.ins.length; i++) {
        signingTxB.sign(i, revealKey)
      }
      return signingTxB.build().toHex()
    })
}


/**
 * Generates a bitcoin spend to a specified address. This will fund up to `amount`
 *   of satoshis from the payer's UTXOs. It will generate a change output if and only
 *   if the amount of leftover change is *greater* than the additional fees associated
 *   with the extra output. If the requested amount is not enough to fund the transaction's
 *   associated fees, then this will reject with a InvalidAmountError
 *
 * UTXOs are selected largest to smallest, and UTXOs which cannot fund the fees associated
 *   with their own input will not be included.
 *
 * If you specify an amount > the total balance of the payer address, then this will
 *   generate a maximum spend transaction
 *
 * @param {String} destinationAddress - the address to receive the bitcoin payment
 * @param {String} paymentKeyHex - a hex string of the private key used to
 *    fund the bitcoin spend
 * @param {number} amount - the amount in satoshis for the payment address to
 *    spend in this transaction
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 * @private
 */
function makeBitcoinSpend(destinationAddress: string,
                          paymentKeyHex: string,
                          amount: number) {
  if (amount <= 0) {
    return Promise.reject(new InvalidParameterError('amount', 'amount must be greater than zero'))
  }

  const network = config.network
  const paymentKey = hexStringToECPair(paymentKeyHex)
  const paymentAddress = paymentKey.getAddress()

  return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
    .then(([utxos, feeRate]) => {
      const txB = new bitcoinjs.TransactionBuilder(network.layer1)
      const destinationIndex = txB.addOutput(destinationAddress, 0)

      // will add utxos up to _amount_ and return the amount of leftover _change_
      let change
      try {
        change = addUTXOsToFund(txB, utxos, amount, feeRate, false)
      } catch (err) {
        if (err.name === 'NotEnoughFundsError') {
          // actual amount funded = amount requested - remainder
          amount -= err.leftToFund
          change = 0
        } else {
          throw err
        }
      }

      let feesToPay = feeRate * estimateTXBytes(txB, 0, 0)
      const feeForChange = feeRate * (estimateTXBytes(txB, 0, 1)) - feesToPay

      // it's worthwhile to add a change output
      if (change > feeForChange) {
        feesToPay += feeForChange
        txB.addOutput(paymentAddress, change)
      }

      // now let's compute how much output is leftover once we pay the fees.
      const outputAmount = amount - feesToPay
      if (outputAmount < DUST_MINIMUM) {
        throw new InvalidAmountError(feesToPay, amount)
      }

      // we need to manually set the output values now
      txB.tx.outs[destinationIndex].value = outputAmount

      // ready to sign.
      for (let i = 0; i < txB.tx.ins.length; i++) {
        txB.sign(i, paymentKey)
      }
      return txB.build().toHex()
    })
}

export const transactions = {
  makeRenewal, makeUpdate, makePreorder, makeRegister, makeTransfer, makeRevoke,
  makeNamespacePreorder, makeNamespaceReveal, makeNamespaceReady, makeBitcoinSpend,
  BlockstackNamespace,
  estimatePreorder, estimateRegister, estimateTransfer, estimateUpdate, estimateRenewal,
  estimateRevoke, estimateNamespacePreorder, estimateNamespaceReveal, estimateNamespaceReady
}
