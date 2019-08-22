

import { TransactionBuilder, address as bjsAddress, TxOutput } from 'bitcoinjs-lib'
// @ts-ignore
import * as BN from 'bn.js'

import {
  addUTXOsToFund, DUST_MINIMUM,
  estimateTXBytes, sumOutputValues, hash160, signInputs, getTransactionInsideBuilder
} from './utils'
import {
  makePreorderSkeleton, makeRegisterSkeleton,
  makeUpdateSkeleton, makeTransferSkeleton, makeRenewalSkeleton,
  makeRevokeSkeleton, makeNamespacePreorderSkeleton,
  makeNamespaceRevealSkeleton, makeNamespaceReadySkeleton,
  makeNameImportSkeleton, makeAnnounceSkeleton,
  makeTokenTransferSkeleton, BlockstackNamespace
} from './skeletons'

import { config } from '../config'
import { InvalidAmountError, InvalidParameterError } from '../errors'
import { TransactionSigner, PubkeyHashSigner } from './signers'
import { UTXO } from '../network'

const dummyConsensusHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const dummyZonefileHash  = 'ffffffffffffffffffffffffffffffffffffffff'

/**
* @ignore
*/
function addOwnerInput(utxos: UTXO[],
                       ownerAddress: string,
                       txB: TransactionBuilder,
                       addChangeOut: boolean = true
) {
  // add an owner UTXO and a change out.
  if (utxos.length <= 0) {
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

/**
* @ignore
*/
function fundTransaction(txB: TransactionBuilder, paymentAddress: string,
                         utxos: UTXO[],
                         feeRate: number, inAmounts: number, changeIndex: number | null = null
) {
  // change index for the payer.
  if (changeIndex === null) {
    changeIndex = txB.addOutput(paymentAddress, DUST_MINIMUM)
  }
  // fund the transaction fee.
  const txFee = estimateTXBytes(txB, 0, 0) * feeRate
  const outAmounts = sumOutputValues(txB)
  const change = addUTXOsToFund(txB, utxos, txFee + outAmounts - inAmounts, feeRate)
  const txInner = getTransactionInsideBuilder(txB)
  const txOut = txInner.outs[changeIndex] as TxOutput
  txOut.value += change
  return txB
}

/**
* @ignore
*/
function returnTransactionHex(txB: TransactionBuilder,
                              buildIncomplete: boolean = false
) {
  if (buildIncomplete) {
    return txB.buildIncomplete().toHex()
  } else {
    return txB.build().toHex()
  }
}

/**
* @ignore
*/
function getTransactionSigner(input: string | TransactionSigner): TransactionSigner {
  if (typeof input === 'string') {
    return PubkeyHashSigner.fromHexString(input)
  } else {
    return input
  }
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
                          paymentUtxos: number = 1
): Promise<number> {
  const network = config.network
  const preorderPromise = network.getNamePrice(fullyQualifiedName)
    .then(namePrice => makePreorderSkeleton(
      fullyQualifiedName, dummyConsensusHash, paymentAddress,
      network.getDefaultBurnAddress(), namePrice,
      destinationAddress
    ))

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
                          paymentUtxos: number = 1
): Promise<number> {
  const network = config.network

  let valueHash
  if (includingZonefile) {
    valueHash = dummyZonefileHash
  }

  const registerTX = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, valueHash
  )

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
                        paymentUtxos: number = 1
): Promise<number> {
  const network = config.network

  const updateTX = makeUpdateSkeleton(
    fullyQualifiedName, dummyConsensusHash, dummyZonefileHash
  )

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
                          paymentUtxos: number = 1
): Promise<number> {
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
                         paymentUtxos: number = 1
): Promise<number> {
  const network = config.network

  let valueHash: string
  if (includingZonefile) {
    valueHash = dummyZonefileHash
  }

  const renewalPromise = network.getNamePrice(fullyQualifiedName)
    .then(namePrice => makeRenewalSkeleton(
      fullyQualifiedName, destinationAddress, ownerAddress,
      network.getDefaultBurnAddress(), namePrice, valueHash
    ))

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
                        paymentUtxos: number = 1
): Promise<number>  {
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
                                   paymentUtxos: number = 1
): Promise<number> {
  const network = config.network

  const preorderPromise = network.getNamespacePrice(namespaceID)
    .then(namespacePrice => makeNamespacePreorderSkeleton(
      namespaceID, dummyConsensusHash, paymentAddress, revealAddress,
      namespacePrice
    ))

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
 * @private
 */
function estimateNamespaceReveal(namespace: BlockstackNamespace,
                                 revealAddress: string,
                                 paymentAddress: string,
                                 paymentUtxos: number = 1
): Promise<number> {
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
 *  fund this namespacey-ready transaction.
 * @private
 */
function estimateNamespaceReady(namespaceID: string,
                                revealUtxos: number = 1
): Promise<number> {
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
 * Estimates the cost of a name-import transaction
 * @param {String} name - the fully-qualified name
 * @param {String} recipientAddr - the recipient
 * @param {String} zonefileHash - the zone file hash
 * @param {Number} importUtxos - the number of UTXOs we expect will
 *  be required from the importer address
 * @returns {Promise} - a promise which resolves to the satoshi cost
 *  to fund this name-import transaction
 * @private
 */
function estimateNameImport(name: string,
                            recipientAddr: string,
                            zonefileHash: string,
                            importUtxos: number = 1
): Promise<number> {
  const network = config.network
  const importTX = makeNameImportSkeleton(name, recipientAddr, zonefileHash)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(importTX)
      const txFee = feeRate * estimateTXBytes(importTX, importUtxos, 1)
      return txFee + outputsValue
    })
}

/**
 * Estimates the cost of an announce transaction
 * @param {String} messageHash - the hash of the message
 * @param {Number} senderUtxos - the number of utxos we expect will
 *  be required from the importer address
 * @returns {Promise} - a promise which resolves to the satoshi cost
 *  to fund this announce transaction
 * @private
 */
function estimateAnnounce(messageHash: string,
                          senderUtxos: number = 1
): Promise<number> {
  const network = config.network
  const announceTX = makeAnnounceSkeleton(messageHash)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(announceTX)
      const txFee = feeRate * estimateTXBytes(announceTX, senderUtxos, 1)
      return txFee + outputsValue
    })
}

/**
 * Estimates the cost of a token-transfer transaction
 * @param {String} recipientAddress - the recipient of the tokens
 * @param {String} tokenType - the type of token to spend
 * @param {Object} tokenAmount - a 64-bit unsigned BigInteger encoding the number of tokens
 *   to spend
 * @param {String} scratchArea - an arbitrary string to store with the transaction
 * @param {Number} senderUtxos - the number of utxos we expect will
 *  be required from the importer address
 * @param {Number} additionalOutputs - the number of outputs we expect to add beyond
 *  just the recipient output (default = 1, if the token owner is also the bitcoin funder)
 * @returns {Promise} - a promise which resolves to the satoshi cost to
 *  fund this token-transfer transaction
 * @private
 */
function estimateTokenTransfer(recipientAddress: string,
                               tokenType: string,
                               tokenAmount: BN,
                               scratchArea: string,
                               senderUtxos: number = 1,
                               additionalOutputs: number = 1
) {
  const network = config.network
  const tokenTransferTX = makeTokenTransferSkeleton(
    recipientAddress, dummyConsensusHash, tokenType, tokenAmount, scratchArea)

  return network.getFeeRate()
    .then((feeRate) => {
      const outputsValue = sumOutputValues(tokenTransferTX)
      const txFee = feeRate * estimateTXBytes(tokenTransferTX, senderUtxos, additionalOutputs)
      return txFee + outputsValue
    })
}

/**
 * Generates a preorder transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to pre-order
 * @param {String} destinationAddress - the address to receive the name (this
 *    must be passed as the 'registrationAddress' in the register transaction)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key used to fund the transaction or a transaction signer object
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 * indicating whether the function should attempt to return an unsigned (or not fully signed)
 * transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makePreorder(fullyQualifiedName: string,
                      destinationAddress: string,
                      paymentKeyIn: string | TransactionSigner,
                      buildIncomplete: boolean = false
) {
  const network = config.network

  const namespace = fullyQualifiedName.split('.').pop()

  const paymentKey = getTransactionSigner(paymentKeyIn)

  return paymentKey.getAddress().then((preorderAddress) => {
    const preorderPromise = Promise.all([network.getConsensusHash(),
                                         network.getNamePrice(fullyQualifiedName),
                                         network.getNamespaceBurnAddress(namespace)])
      .then(([consensusHash, namePrice, burnAddress]) => makePreorderSkeleton(
        fullyQualifiedName, consensusHash, preorderAddress, burnAddress,
        namePrice, destinationAddress
      ))

    return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
      .then(([utxos, feeRate, preorderSkeleton]) => {
        const txB = TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1)
        txB.setVersion(1)

        const changeIndex = 1 // preorder skeleton always creates a change output at index = 1
        const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex)

        return signInputs(signingTxB, paymentKey)
      })
      .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
  })
}

/**
 * Generates an update transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to update
 * @param {String | TransactionSigner} ownerKeyIn - a hex string of the
 *    owner key, or a transaction signer object. This will provide one
 *    UTXO input, and also recieve a dust output.
 * @param {String | TransactionSigner} paymentKeyIn - a hex string, or a
 *    transaction signer object, of the private key used to fund the
 *    transaction's txfees
 * @param {String} zonefile - the zonefile data to update (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the UPDATE propagates.
 * @param {String} valueHash - if given, this is the hash to store (instead of
 *    zonefile).  zonefile will be ignored if this is given.
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *    indicating whether the function should attempt to return an unsigned (or not fully signed)
 *    transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeUpdate(fullyQualifiedName: string,
                    ownerKeyIn: string | TransactionSigner,
                    paymentKeyIn: string | TransactionSigner,
                    zonefile: string,
                    valueHash: string = '',
                    buildIncomplete: boolean = false
) {
  const network = config.network
  if (!valueHash && !zonefile) {
    return Promise.reject(
      new Error('Need zonefile or valueHash arguments')
    )
  }
  if (valueHash.length === 0) {
    if (!zonefile) {
      return Promise.reject(
        new Error('Need zonefile or valueHash arguments')
      )
    }
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  } else if (valueHash.length !== 40) {
    return Promise.reject(
      new Error(`Invalid valueHash ${valueHash}`)
    )
  }

  const paymentKey = getTransactionSigner(paymentKeyIn)
  const ownerKey = getTransactionSigner(ownerKeyIn)

  return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
    .then(([ownerAddress, paymentAddress]) => {
      const txPromise = network.getConsensusHash()
        .then(consensusHash => makeUpdateSkeleton(fullyQualifiedName, consensusHash, valueHash))
        .then((updateTX) => {
          const txB = TransactionBuilder.fromTransaction(updateTX, network.layer1)
          txB.setVersion(1)
          return txB
        })

      return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                          network.getUTXOs(ownerAddress), network.getFeeRate()])
        .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
          const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB)
          const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                             ownerInput.value)

          return signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }])
        })
    })
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates a register transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to register
 * @param {String} registerAddress - the address to receive the name (this
 *    must have been passed as the 'destinationAddress' in the preorder transaction)
 *    this address will receive a dust UTXO
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key (or a TransactionSigner object) used to fund the
 *    transaction (this *must* be the same as the payment address used
 *    to fund the preorder)
 * @param {String} zonefile - the zonefile data to include (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the UPDATE propagates.
 * @param {String} valueHash - the hash of the zone file data to include.
 *    It will be used instead of zonefile, if given
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *    indicating whether the function should attempt to return an unsigned (or not fully signed)
 *    transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRegister(fullyQualifiedName: string,
                      registerAddress: string,
                      paymentKeyIn: string | TransactionSigner,
                      zonefile: string = null,
                      valueHash: string = null,
                      buildIncomplete: boolean = false
) {
  const network = config.network
  if (!valueHash && !!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  } else if (!!valueHash && valueHash.length !== 40) {
    return Promise.reject(
      new Error(`Invalid zonefile hash ${valueHash}`)
    )
  }

  const registerSkeleton = makeRegisterSkeleton(
    fullyQualifiedName, registerAddress, valueHash
  )

  const txB = TransactionBuilder.fromTransaction(registerSkeleton, network.layer1)
  txB.setVersion(1)

  const paymentKey = getTransactionSigner(paymentKeyIn)

  return paymentKey.getAddress().then(
    paymentAddress => Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const signingTxB = fundTransaction(txB, paymentAddress, utxos, feeRate, 0)

        return signInputs(signingTxB, paymentKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}


/**
 * Generates a transfer transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to transfer
 * @param {String} destinationAddress - the address to receive the name.
 *    this address will receive a dust UTXO
 * @param {String | TransactionSigner} ownerKeyIn - a hex string of
 *    the current owner's private key (or a TransactionSigner object)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key used to fund the transaction (or a
 *    TransactionSigner object)
 * @param {Boolean} keepZonefile - if true, then preserve the name's zone file
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *   indicating whether the function should attempt to return an unsigned (or not fully signed)
 *   transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeTransfer(fullyQualifiedName: string,
                      destinationAddress: string,
                      ownerKeyIn: string | TransactionSigner,
                      paymentKeyIn: string | TransactionSigner,
                      keepZonefile: boolean = false,
                      buildIncomplete: boolean = false
) {
  const network = config.network

  const paymentKey = getTransactionSigner(paymentKeyIn)
  const ownerKey = getTransactionSigner(ownerKeyIn)

  return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
    .then(([ownerAddress, paymentAddress]) => {
      const txPromise = network.getConsensusHash()
        .then(consensusHash => makeTransferSkeleton(
          fullyQualifiedName, consensusHash, destinationAddress, keepZonefile
        ))
        .then((transferTX) => {
          const txB = TransactionBuilder
            .fromTransaction(transferTX, network.layer1)
          txB.setVersion(1)
          return txB
        })

      return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                          network.getUTXOs(ownerAddress), network.getFeeRate()])
        .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
          const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB)
          const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                             ownerInput.value)

          return signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }])
        })
    })
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates a revoke transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to revoke
 * @param {String | TransactionSigner} ownerKeyIn - a hex string of
 *    the current owner's private key (or a TransactionSigner object)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key used to fund the transaction (or a
 *    TransactionSigner object)
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *    indicating whether the function should attempt to return an unsigned (or not fully signed)
 *    transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRevoke(fullyQualifiedName: string,
                    ownerKeyIn: string | TransactionSigner,
                    paymentKeyIn: string | TransactionSigner,
                    buildIncomplete: boolean = false
) {
  const network = config.network

  const paymentKey = getTransactionSigner(paymentKeyIn)
  const ownerKey = getTransactionSigner(ownerKeyIn)

  return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
    .then(([ownerAddress, paymentAddress]) => {
      const revokeTX = makeRevokeSkeleton(fullyQualifiedName)
      const txPromise = TransactionBuilder.fromTransaction(revokeTX, network.layer1)
      txPromise.setVersion(1)


      return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                          network.getUTXOs(ownerAddress), network.getFeeRate()])
        .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
          const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB)
          const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                             ownerInput.value)
          return signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }])
        })
    })
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates a renewal transaction for a domain name.
 * @param {String} fullyQualifiedName - the name to transfer
 * @param {String} destinationAddress - the address to receive the name after renewal
 *    this address will receive a dust UTXO
 * @param {String | TransactionSigner} ownerKeyIn - a hex string of
 *    the current owner's private key (or a TransactionSigner object)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key used to fund the renewal (or a TransactionSigner
 *    object)
 * @param {String} zonefile - the zonefile data to include, if given (this will be hashed
 *    to include in the transaction), the zonefile itself must be published
 *    after the RENEWAL propagates.
 * @param {String} valueHash - the raw zone file hash to include (this will be used
 *    instead of zonefile, if given).
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *    indicating whether the function should attempt to return an unsigned (or not fully signed)
 *    transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 */
function makeRenewal(fullyQualifiedName: string,
                     destinationAddress: string,
                     ownerKeyIn: string | TransactionSigner,
                     paymentKeyIn: string | TransactionSigner,
                     zonefile: string = null,
                     valueHash: string = null,
                     buildIncomplete: boolean = false
) {
  const network = config.network

  if (!valueHash && !!zonefile) {
    valueHash = hash160(Buffer.from(zonefile)).toString('hex')
  }

  const namespace = fullyQualifiedName.split('.').pop()

  const paymentKey = getTransactionSigner(paymentKeyIn)
  const ownerKey = getTransactionSigner(ownerKeyIn)

  return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
    .then(([ownerAddress, paymentAddress]) => {
      const txPromise = Promise.all([network.getNamePrice(fullyQualifiedName),
                                     network.getNamespaceBurnAddress(namespace)])
        .then(([namePrice, burnAddress]) => makeRenewalSkeleton(
          fullyQualifiedName, destinationAddress, ownerAddress,
          burnAddress, namePrice, valueHash
        ))
        .then((tx) => {
          const txB = TransactionBuilder.fromTransaction(tx, network.layer1)
          txB.setVersion(1)
          return txB
        })

      return Promise.all([txPromise, network.getUTXOs(paymentAddress),
                          network.getUTXOs(ownerAddress), network.getFeeRate()])
        .then(([txB, payerUtxos, ownerUtxos, feeRate]) => {
          const ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB, false)
          const txInner = getTransactionInsideBuilder(txB)
          const ownerOutput = txInner.outs[2] as TxOutput
          const ownerOutputAddr = bjsAddress.fromOutputScript(
            ownerOutput.script, network.layer1
          )
          if (ownerOutputAddr !== ownerAddress) {
            return Promise.reject(
              new Error(`Original owner ${ownerAddress} should have an output at `
                        + `index 2 in transaction was ${ownerOutputAddr}`)
            )
          }
          ownerOutput.value = ownerInput.value
          const signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate,
                                             ownerInput.value)
          return signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }])
        })
    })
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}


/**
 * Generates a namespace preorder transaction for a namespace
 * @param {String} namespaceID - the namespace to pre-order
 * @param {String} revealAddress - the address to receive the namespace (this
 *    must be passed as the 'revealAddress' in the namespace-reveal transaction)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string of
 *    the private key used to fund the transaction (or a
 *    TransactionSigner object)
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *    indicating whether the function should attempt to return an unsigned (or not fully signed)
 *    transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *    this function *does not* perform the requisite safety checks -- please see
 *    the safety module for those.
 * @private
 * 
 * @ignore
 */
function makeNamespacePreorder(namespaceID: string,
                               revealAddress: string,
                               paymentKeyIn: string | TransactionSigner,
                               buildIncomplete: boolean = false
) {
  const network = config.network

  const paymentKey = getTransactionSigner(paymentKeyIn)

  return paymentKey.getAddress().then((preorderAddress) => {
    const preorderPromise = Promise.all([network.getConsensusHash(),
                                         network.getNamespacePrice(namespaceID)])
      .then(([consensusHash, namespacePrice]) => makeNamespacePreorderSkeleton(
        namespaceID, consensusHash, preorderAddress, revealAddress,
        namespacePrice))

    return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
      .then(([utxos, feeRate, preorderSkeleton]) => {
        const txB = TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1)
        txB.setVersion(1)

        const changeIndex = 1 // preorder skeleton always creates a change output at index = 1
        const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex)

        return signInputs(signingTxB, paymentKey)
      })
      .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
  })
}


/**
 * Generates a namespace reveal transaction for a namespace
 * @param {BlockstackNamespace} namespace - the namespace to reveal
 * @param {String} revealAddress - the address to receive the namespace (this
 *   must be passed as the 'revealAddress' in the namespace-reveal transaction)
 * @param {String | TransactionSigner} paymentKeyIn - a hex string (or
 *   a TransactionSigner object) of the private key used to fund the
 *   transaction
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *   indicating whether the function should attempt to return an unsigned (or not fully signed)
 *   transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *   this function *does not* perform the requisite safety checks -- please see
 *   the safety module for those.
 * @private
 */
function makeNamespaceReveal(namespace: BlockstackNamespace,
                             revealAddress: string,
                             paymentKeyIn: string | TransactionSigner,
                             buildIncomplete: boolean = false
) {
  const network = config.network

  if (!namespace.check()) {
    return Promise.reject(new Error('Invalid namespace'))
  }

  const namespaceRevealTX = makeNamespaceRevealSkeleton(namespace, revealAddress)

  const paymentKey = getTransactionSigner(paymentKeyIn)

  return paymentKey.getAddress().then(
    preorderAddress => Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const txB = TransactionBuilder
          .fromTransaction(namespaceRevealTX, network.layer1)
        txB.setVersion(1)
        const signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0)

        return signInputs(signingTxB, paymentKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}


/**
 * Generates a namespace ready transaction for a namespace
 * @param {String} namespaceID - the namespace to launch
 * @param {String | TransactionSigner} revealKeyIn - the private key
 *  of the 'revealAddress' used to reveal the namespace
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *  indicating whether the function should attempt to return an unsigned (or not fully signed)
 *  transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 *  this function *does not* perform the requisite safety checks -- please see
 *  the safety module for those.
 * @private
 */
function makeNamespaceReady(namespaceID: string,
                            revealKeyIn: string | TransactionSigner,
                            buildIncomplete: boolean = false
) {
  const network = config.network

  const namespaceReadyTX = makeNamespaceReadySkeleton(namespaceID)

  const revealKey = getTransactionSigner(revealKeyIn)

  return revealKey.getAddress().then(
    revealAddress => Promise.all([network.getUTXOs(revealAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const txB = TransactionBuilder.fromTransaction(namespaceReadyTX, network.layer1)
        txB.setVersion(1)
        const signingTxB = fundTransaction(txB, revealAddress, utxos, feeRate, 0)
        return signInputs(signingTxB, revealKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates a name import transaction for a namespace
 * @param {String} name - the name to import
 * @param {String} recipientAddr - the address to receive the name
 * @param {String} zonefileHash - the hash of the zonefile to give this name
 * @param {String | TransactionSigner} importerKeyIn - the private key
 * that pays for the import
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 * indicating whether the function should attempt to return an unsigned (or not fully signed)
 * transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 * this function does not perform the requisite safety checks -- please see
 * the safety module for those.
 * @private
 */
function makeNameImport(name: string,
                        recipientAddr: string,
                        zonefileHash: string,
                        importerKeyIn: string | TransactionSigner,
                        buildIncomplete: boolean = false
) {
  const network = config.network

  const nameImportTX = makeNameImportSkeleton(name, recipientAddr, zonefileHash)

  const importerKey = getTransactionSigner(importerKeyIn)

  return importerKey.getAddress().then(
    importerAddress => Promise.all([network.getUTXOs(importerAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const txB = TransactionBuilder.fromTransaction(nameImportTX, network.layer1)
        const signingTxB = fundTransaction(txB, importerAddress, utxos, feeRate, 0)
        return signInputs(signingTxB, importerKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates an announce transaction
 * @param {String} messageHash - the hash of the message to send.  Should be
 *  an already-announced zone file hash
 * @param {String | TransactionSigner} senderKeyIn - the private key
 *  that pays for the transaction.  Should be the key that owns the
 *  name that the message recipients subscribe to
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 * indicating whether the function should attempt to return an unsigned (or not fully signed)
 * transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 * this function does not perform the requisite safety checks -- please see the
 * safety module for those.
 * @private
 */
function makeAnnounce(messageHash: string,
                      senderKeyIn: string | TransactionSigner,
                      buildIncomplete: boolean = false
) {
  const network = config.network

  const announceTX = makeAnnounceSkeleton(messageHash)

  const senderKey = getTransactionSigner(senderKeyIn)

  return senderKey.getAddress().then(
    senderAddress => Promise.all([network.getUTXOs(senderAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const txB = TransactionBuilder.fromTransaction(announceTX, network.layer1)
        const signingTxB = fundTransaction(txB, senderAddress, utxos, feeRate, 0)
        return signInputs(signingTxB, senderKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

/**
 * Generates a token-transfer transaction
 * @param {String} recipientAddress - the address to receive the tokens
 * @param {String} tokenType - the type of tokens to send
 * @param {Object} tokenAmount - the BigInteger encoding of an unsigned 64-bit number of
 *  tokens to send
 * @param {String} scratchArea - an arbitrary string to include with the transaction
 * @param {String | TransactionSigner} senderKeyIn - the hex-encoded private key to send
 *   the tokens
 * @param {String | TransactionSigner} btcFunderKeyIn - the hex-encoded private key to fund
 *   the bitcoin fees for the transaction. Optional -- if not passed, will attempt to
 *   fund with sender key.
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 *   indicating whether the function should attempt to return an unsigned (or not fully signed)
 *   transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 * This function does not perform the requisite safety checks -- please see the
 * safety module for those.
 * @private
 */
function makeTokenTransfer(recipientAddress: string, tokenType: string,
                           tokenAmount: BN, scratchArea: string,
                           senderKeyIn: string | TransactionSigner,
                           btcFunderKeyIn?: string | TransactionSigner,
                           buildIncomplete: boolean = false
) {
  const network = config.network
  const separateFunder = !!btcFunderKeyIn

  const senderKey = getTransactionSigner(senderKeyIn)
  const btcKey = btcFunderKeyIn ? getTransactionSigner(btcFunderKeyIn) : senderKey

  const txPromise = network.getConsensusHash()
    .then(consensusHash =>  makeTokenTransferSkeleton(
      recipientAddress, consensusHash, tokenType, tokenAmount, scratchArea))

  return Promise.all([senderKey.getAddress(), btcKey.getAddress()])
    .then(([senderAddress, btcAddress]) => {
      const btcUTXOsPromise = separateFunder
        ? network.getUTXOs(btcAddress) : Promise.resolve<UTXO[]>([])
      return Promise.all([
        network.getUTXOs(senderAddress),
        btcUTXOsPromise,
        network.getFeeRate(),
        txPromise
      ]).then(([senderUTXOs, btcUTXOs, feeRate, tokenTransferTX]) => {
        const txB = TransactionBuilder.fromTransaction(tokenTransferTX, network.layer1)

        if (separateFunder) {
          const payerInput = addOwnerInput(senderUTXOs, senderAddress, txB)
          const signingTxB = fundTransaction(txB, btcAddress, btcUTXOs, feeRate, payerInput.value)
          return signInputs(signingTxB, btcKey,
                            [{ index: payerInput.index, signer: senderKey }])
        } else {
          const signingTxB = fundTransaction(txB, senderAddress, senderUTXOs, feeRate, 0)
          return signInputs(signingTxB, senderKey)
        }
      })
    })
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
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
 * @param {String | TransactionSigner} paymentKeyIn - the private key
 *    used to fund the bitcoin spend
 * @param {number} amount - the amount in satoshis for the payment address to
 *    spend in this transaction
 * @param {boolean} buildIncomplete - optional boolean, defaults to false,
 * indicating whether the function should attempt to return an unsigned (or not fully signed)
 * transaction. Useful for passing around a TX for multi-sig input signing.
 * @returns {Promise} - a promise which resolves to the hex-encoded transaction.
 * @private
 */
function makeBitcoinSpend(destinationAddress: string,
                          paymentKeyIn: string | TransactionSigner,
                          amount: number,
                          buildIncomplete: boolean = false
) {
  if (amount <= 0) {
    return Promise.reject(new InvalidParameterError('amount', 'amount must be greater than zero'))
  }

  const network = config.network

  const paymentKey = getTransactionSigner(paymentKeyIn)

  return paymentKey.getAddress().then(
    paymentAddress => Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
      .then(([utxos, feeRate]) => {
        const txB = new TransactionBuilder(network.layer1)
        txB.setVersion(1)
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
        const txInner = getTransactionInsideBuilder(txB)
        const txOut = txInner.outs[destinationIndex] as TxOutput
        txOut.value = outputAmount

        // ready to sign.
        return signInputs(txB, paymentKey)
      })
  )
    .then(signingTxB => returnTransactionHex(signingTxB, buildIncomplete))
}

export const transactions = {
  makeRenewal,
  makeUpdate,
  makePreorder,
  makeRegister,
  makeTransfer,
  makeRevoke,
  makeNamespacePreorder,
  makeNamespaceReveal,
  makeNamespaceReady,
  makeBitcoinSpend,
  makeNameImport,
  makeAnnounce,
  makeTokenTransfer,
  BlockstackNamespace,
  estimatePreorder,
  estimateRegister,
  estimateTransfer,
  estimateUpdate,
  estimateRenewal,
  estimateRevoke,
  estimateNamespacePreorder,
  estimateNamespaceReveal,
  estimateNamespaceReady,
  estimateNameImport,
  estimateAnnounce,
  estimateTokenTransfer
}
