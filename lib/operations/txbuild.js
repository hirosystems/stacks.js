"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var utils_1 = require("./utils");
var skeletons_1 = require("./skeletons");
var config_1 = require("../config");
var errors_1 = require("../errors");
var signers_1 = require("./signers");
var dummyConsensusHash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
var dummyZonefileHash = 'ffffffffffffffffffffffffffffffffffffffff';
/**
* @ignore
*/
function addOwnerInput(utxos, ownerAddress, txB, addChangeOut) {
    if (addChangeOut === void 0) { addChangeOut = true; }
    // add an owner UTXO and a change out.
    if (utxos.length <= 0) {
        throw new Error('Owner has no UTXOs for UPDATE.');
    }
    utxos.sort(function (a, b) { return a.value - b.value; });
    var ownerUTXO = utxos[0];
    var ownerInput = txB.addInput(ownerUTXO.tx_hash, ownerUTXO.tx_output_n);
    if (addChangeOut) {
        txB.addOutput(ownerAddress, ownerUTXO.value);
    }
    return { index: ownerInput, value: ownerUTXO.value };
}
/**
* @ignore
*/
function fundTransaction(txB, paymentAddress, utxos, feeRate, inAmounts, changeIndex) {
    if (changeIndex === void 0) { changeIndex = null; }
    // change index for the payer.
    if (changeIndex === null) {
        changeIndex = txB.addOutput(paymentAddress, utils_1.DUST_MINIMUM);
    }
    // fund the transaction fee.
    var txFee = utils_1.estimateTXBytes(txB, 0, 0) * feeRate;
    var outAmounts = utils_1.sumOutputValues(txB);
    var change = utils_1.addUTXOsToFund(txB, utxos, txFee + outAmounts - inAmounts, feeRate);
    var txInner = utils_1.getTransactionInsideBuilder(txB);
    txInner.outs[changeIndex].value += change;
    return txB;
}
/**
* @ignore
*/
function returnTransactionHex(txB, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    if (buildIncomplete) {
        return txB.buildIncomplete().toHex();
    }
    else {
        return txB.build().toHex();
    }
}
/**
* @ignore
*/
function getTransactionSigner(input) {
    if (typeof input === 'string') {
        return signers_1.PubkeyHashSigner.fromHexString(input);
    }
    else {
        return input;
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
function estimatePreorder(fullyQualifiedName, destinationAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var preorderPromise = network.getNamePrice(fullyQualifiedName)
        .then(function (namePrice) { return skeletons_1.makePreorderSkeleton(fullyQualifiedName, dummyConsensusHash, paymentAddress, network.getDefaultBurnAddress(), namePrice, destinationAddress); });
    return Promise.all([network.getFeeRate(), preorderPromise])
        .then(function (_a) {
        var feeRate = _a[0], preorderTX = _a[1];
        var outputsValue = utils_1.sumOutputValues(preorderTX);
        var txFee = feeRate * utils_1.estimateTXBytes(preorderTX, paymentUtxos, 0);
        return txFee + outputsValue;
    });
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
function estimateRegister(fullyQualifiedName, registerAddress, paymentAddress, includingZonefile, paymentUtxos) {
    if (includingZonefile === void 0) { includingZonefile = false; }
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var valueHash;
    if (includingZonefile) {
        valueHash = dummyZonefileHash;
    }
    var registerTX = skeletons_1.makeRegisterSkeleton(fullyQualifiedName, registerAddress, valueHash);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(registerTX);
        // 1 additional output for payer change
        var txFee = feeRate * utils_1.estimateTXBytes(registerTX, paymentUtxos, 1);
        return txFee + outputsValue;
    });
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
function estimateUpdate(fullyQualifiedName, ownerAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var updateTX = skeletons_1.makeUpdateSkeleton(fullyQualifiedName, dummyConsensusHash, dummyZonefileHash);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(updateTX);
        // 1 additional input for the owner
        // 2 additional outputs for owner / payer change
        var txFee = feeRate * utils_1.estimateTXBytes(updateTX, 1 + paymentUtxos, 2);
        return txFee + outputsValue;
    });
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
function estimateTransfer(fullyQualifiedName, destinationAddress, ownerAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var transferTX = skeletons_1.makeTransferSkeleton(fullyQualifiedName, dummyConsensusHash, destinationAddress);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(transferTX);
        // 1 additional input for the owner
        // 2 additional outputs for owner / payer change
        var txFee = feeRate * utils_1.estimateTXBytes(transferTX, 1 + paymentUtxos, 2);
        return txFee + outputsValue;
    });
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
function estimateRenewal(fullyQualifiedName, destinationAddress, ownerAddress, paymentAddress, includingZonefile, paymentUtxos) {
    if (includingZonefile === void 0) { includingZonefile = false; }
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var valueHash;
    if (includingZonefile) {
        valueHash = dummyZonefileHash;
    }
    var renewalPromise = network.getNamePrice(fullyQualifiedName)
        .then(function (namePrice) { return skeletons_1.makeRenewalSkeleton(fullyQualifiedName, destinationAddress, ownerAddress, network.getDefaultBurnAddress(), namePrice, valueHash); });
    return Promise.all([network.getFeeRate(), renewalPromise])
        .then(function (_a) {
        var feeRate = _a[0], renewalTX = _a[1];
        var outputsValue = utils_1.sumOutputValues(renewalTX);
        // 1 additional input for the owner
        // and renewal skeleton includes all outputs for owner change, but not for payer change.
        var txFee = feeRate * utils_1.estimateTXBytes(renewalTX, 1 + paymentUtxos, 1);
        return txFee + outputsValue - 5500; // don't count the dust change for old owner.
    });
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
function estimateRevoke(fullyQualifiedName, ownerAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var revokeTX = skeletons_1.makeRevokeSkeleton(fullyQualifiedName);
    return Promise.all([network.getFeeRate()])
        .then(function (_a) {
        var feeRate = _a[0];
        var outputsValue = utils_1.sumOutputValues(revokeTX);
        // 1 additional input for owner
        // 1 additional output for payer change
        var txFee = feeRate * utils_1.estimateTXBytes(revokeTX, 1 + paymentUtxos, 2);
        return txFee + outputsValue;
    });
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
function estimateNamespacePreorder(namespaceID, revealAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var preorderPromise = network.getNamespacePrice(namespaceID)
        .then(function (namespacePrice) { return skeletons_1.makeNamespacePreorderSkeleton(namespaceID, dummyConsensusHash, paymentAddress, revealAddress, namespacePrice); });
    return Promise.all([network.getFeeRate(), preorderPromise])
        .then(function (_a) {
        var feeRate = _a[0], preorderTX = _a[1];
        var outputsValue = utils_1.sumOutputValues(preorderTX);
        var txFee = feeRate * utils_1.estimateTXBytes(preorderTX, paymentUtxos, 0);
        return txFee + outputsValue;
    });
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
function estimateNamespaceReveal(namespace, revealAddress, paymentAddress, paymentUtxos) {
    if (paymentUtxos === void 0) { paymentUtxos = 1; }
    var network = config_1.config.network;
    var revealTX = skeletons_1.makeNamespaceRevealSkeleton(namespace, revealAddress);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(revealTX);
        // 1 additional output for payer change
        var txFee = feeRate * utils_1.estimateTXBytes(revealTX, paymentUtxos, 1);
        return txFee + outputsValue;
    });
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
function estimateNamespaceReady(namespaceID, revealUtxos) {
    if (revealUtxos === void 0) { revealUtxos = 1; }
    var network = config_1.config.network;
    var readyTX = skeletons_1.makeNamespaceReadySkeleton(namespaceID);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(readyTX);
        var txFee = feeRate * utils_1.estimateTXBytes(readyTX, revealUtxos, 1);
        return txFee + outputsValue;
    });
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
function estimateNameImport(name, recipientAddr, zonefileHash, importUtxos) {
    if (importUtxos === void 0) { importUtxos = 1; }
    var network = config_1.config.network;
    var importTX = skeletons_1.makeNameImportSkeleton(name, recipientAddr, zonefileHash);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(importTX);
        var txFee = feeRate * utils_1.estimateTXBytes(importTX, importUtxos, 1);
        return txFee + outputsValue;
    });
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
function estimateAnnounce(messageHash, senderUtxos) {
    if (senderUtxos === void 0) { senderUtxos = 1; }
    var network = config_1.config.network;
    var announceTX = skeletons_1.makeAnnounceSkeleton(messageHash);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(announceTX);
        var txFee = feeRate * utils_1.estimateTXBytes(announceTX, senderUtxos, 1);
        return txFee + outputsValue;
    });
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
function estimateTokenTransfer(recipientAddress, tokenType, tokenAmount, scratchArea, senderUtxos, additionalOutputs) {
    if (senderUtxos === void 0) { senderUtxos = 1; }
    if (additionalOutputs === void 0) { additionalOutputs = 1; }
    var network = config_1.config.network;
    var tokenTransferTX = skeletons_1.makeTokenTransferSkeleton(recipientAddress, dummyConsensusHash, tokenType, tokenAmount, scratchArea);
    return network.getFeeRate()
        .then(function (feeRate) {
        var outputsValue = utils_1.sumOutputValues(tokenTransferTX);
        var txFee = feeRate * utils_1.estimateTXBytes(tokenTransferTX, senderUtxos, additionalOutputs);
        return txFee + outputsValue;
    });
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
function makePreorder(fullyQualifiedName, destinationAddress, paymentKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var namespace = fullyQualifiedName.split('.').pop();
    var paymentKey = getTransactionSigner(paymentKeyIn);
    return paymentKey.getAddress().then(function (preorderAddress) {
        var preorderPromise = Promise.all([network.getConsensusHash(),
            network.getNamePrice(fullyQualifiedName),
            network.getNamespaceBurnAddress(namespace)])
            .then(function (_a) {
            var consensusHash = _a[0], namePrice = _a[1], burnAddress = _a[2];
            return skeletons_1.makePreorderSkeleton(fullyQualifiedName, consensusHash, preorderAddress, burnAddress, namePrice, destinationAddress);
        });
        return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
            .then(function (_a) {
            var utxos = _a[0], feeRate = _a[1], preorderSkeleton = _a[2];
            var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1);
            txB.setVersion(1);
            var changeIndex = 1; // preorder skeleton always creates a change output at index = 1
            var signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex);
            return utils_1.signInputs(signingTxB, paymentKey);
        })
            .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
    });
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
function makeUpdate(fullyQualifiedName, ownerKeyIn, paymentKeyIn, zonefile, valueHash, buildIncomplete) {
    if (valueHash === void 0) { valueHash = ''; }
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    if (!valueHash && !zonefile) {
        return Promise.reject(new Error('Need zonefile or valueHash arguments'));
    }
    if (valueHash.length === 0) {
        if (!zonefile) {
            return Promise.reject(new Error('Need zonefile or valueHash arguments'));
        }
        valueHash = utils_1.hash160(Buffer.from(zonefile)).toString('hex');
    }
    else if (valueHash.length !== 40) {
        return Promise.reject(new Error("Invalid valueHash " + valueHash));
    }
    var paymentKey = getTransactionSigner(paymentKeyIn);
    var ownerKey = getTransactionSigner(ownerKeyIn);
    return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
        .then(function (_a) {
        var ownerAddress = _a[0], paymentAddress = _a[1];
        var txPromise = network.getConsensusHash()
            .then(function (consensusHash) { return skeletons_1.makeUpdateSkeleton(fullyQualifiedName, consensusHash, valueHash); })
            .then(function (updateTX) {
            var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(updateTX, network.layer1);
            txB.setVersion(1);
            return txB;
        });
        return Promise.all([txPromise, network.getUTXOs(paymentAddress),
            network.getUTXOs(ownerAddress), network.getFeeRate()])
            .then(function (_a) {
            var txB = _a[0], payerUtxos = _a[1], ownerUtxos = _a[2], feeRate = _a[3];
            var ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB);
            var signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate, ownerInput.value);
            return utils_1.signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }]);
        });
    })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeRegister(fullyQualifiedName, registerAddress, paymentKeyIn, zonefile, valueHash, buildIncomplete) {
    if (zonefile === void 0) { zonefile = null; }
    if (valueHash === void 0) { valueHash = null; }
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    if (!valueHash && !!zonefile) {
        valueHash = utils_1.hash160(Buffer.from(zonefile)).toString('hex');
    }
    else if (!!valueHash && valueHash.length !== 40) {
        return Promise.reject(new Error("Invalid zonefile hash " + valueHash));
    }
    var registerSkeleton = skeletons_1.makeRegisterSkeleton(fullyQualifiedName, registerAddress, valueHash);
    var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(registerSkeleton, network.layer1);
    txB.setVersion(1);
    var paymentKey = getTransactionSigner(paymentKeyIn);
    return paymentKey.getAddress().then(function (paymentAddress) { return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var signingTxB = fundTransaction(txB, paymentAddress, utxos, feeRate, 0);
        return utils_1.signInputs(signingTxB, paymentKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeTransfer(fullyQualifiedName, destinationAddress, ownerKeyIn, paymentKeyIn, keepZonefile, buildIncomplete) {
    if (keepZonefile === void 0) { keepZonefile = false; }
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var paymentKey = getTransactionSigner(paymentKeyIn);
    var ownerKey = getTransactionSigner(ownerKeyIn);
    return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
        .then(function (_a) {
        var ownerAddress = _a[0], paymentAddress = _a[1];
        var txPromise = network.getConsensusHash()
            .then(function (consensusHash) { return skeletons_1.makeTransferSkeleton(fullyQualifiedName, consensusHash, destinationAddress, keepZonefile); })
            .then(function (transferTX) {
            var txB = bitcoinjs_lib_1.default.TransactionBuilder
                .fromTransaction(transferTX, network.layer1);
            txB.setVersion(1);
            return txB;
        });
        return Promise.all([txPromise, network.getUTXOs(paymentAddress),
            network.getUTXOs(ownerAddress), network.getFeeRate()])
            .then(function (_a) {
            var txB = _a[0], payerUtxos = _a[1], ownerUtxos = _a[2], feeRate = _a[3];
            var ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB);
            var signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate, ownerInput.value);
            return utils_1.signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }]);
        });
    })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeRevoke(fullyQualifiedName, ownerKeyIn, paymentKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var paymentKey = getTransactionSigner(paymentKeyIn);
    var ownerKey = getTransactionSigner(ownerKeyIn);
    return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
        .then(function (_a) {
        var ownerAddress = _a[0], paymentAddress = _a[1];
        var revokeTX = skeletons_1.makeRevokeSkeleton(fullyQualifiedName);
        var txPromise = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(revokeTX, network.layer1);
        txPromise.setVersion(1);
        return Promise.all([txPromise, network.getUTXOs(paymentAddress),
            network.getUTXOs(ownerAddress), network.getFeeRate()])
            .then(function (_a) {
            var txB = _a[0], payerUtxos = _a[1], ownerUtxos = _a[2], feeRate = _a[3];
            var ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB);
            var signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate, ownerInput.value);
            return utils_1.signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }]);
        });
    })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeRenewal(fullyQualifiedName, destinationAddress, ownerKeyIn, paymentKeyIn, zonefile, valueHash, buildIncomplete) {
    if (zonefile === void 0) { zonefile = null; }
    if (valueHash === void 0) { valueHash = null; }
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    if (!valueHash && !!zonefile) {
        valueHash = utils_1.hash160(Buffer.from(zonefile)).toString('hex');
    }
    var namespace = fullyQualifiedName.split('.').pop();
    var paymentKey = getTransactionSigner(paymentKeyIn);
    var ownerKey = getTransactionSigner(ownerKeyIn);
    return Promise.all([ownerKey.getAddress(), paymentKey.getAddress()])
        .then(function (_a) {
        var ownerAddress = _a[0], paymentAddress = _a[1];
        var txPromise = Promise.all([network.getNamePrice(fullyQualifiedName),
            network.getNamespaceBurnAddress(namespace)])
            .then(function (_a) {
            var namePrice = _a[0], burnAddress = _a[1];
            return skeletons_1.makeRenewalSkeleton(fullyQualifiedName, destinationAddress, ownerAddress, burnAddress, namePrice, valueHash);
        })
            .then(function (tx) {
            var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(tx, network.layer1);
            txB.setVersion(1);
            return txB;
        });
        return Promise.all([txPromise, network.getUTXOs(paymentAddress),
            network.getUTXOs(ownerAddress), network.getFeeRate()])
            .then(function (_a) {
            var txB = _a[0], payerUtxos = _a[1], ownerUtxos = _a[2], feeRate = _a[3];
            var ownerInput = addOwnerInput(ownerUtxos, ownerAddress, txB, false);
            var txInner = utils_1.getTransactionInsideBuilder(txB);
            var ownerOutput = txInner.outs[2];
            var ownerOutputAddr = bitcoinjs_lib_1.default.address.fromOutputScript(ownerOutput.script, network.layer1);
            if (ownerOutputAddr !== ownerAddress) {
                return Promise.reject(new Error("Original owner " + ownerAddress + " should have an output at "
                    + ("index 2 in transaction was " + ownerOutputAddr)));
            }
            ownerOutput.value = ownerInput.value;
            var signingTxB = fundTransaction(txB, paymentAddress, payerUtxos, feeRate, ownerInput.value);
            return utils_1.signInputs(signingTxB, paymentKey, [{ index: ownerInput.index, signer: ownerKey }]);
        });
    })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeNamespacePreorder(namespaceID, revealAddress, paymentKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var paymentKey = getTransactionSigner(paymentKeyIn);
    return paymentKey.getAddress().then(function (preorderAddress) {
        var preorderPromise = Promise.all([network.getConsensusHash(),
            network.getNamespacePrice(namespaceID)])
            .then(function (_a) {
            var consensusHash = _a[0], namespacePrice = _a[1];
            return skeletons_1.makeNamespacePreorderSkeleton(namespaceID, consensusHash, preorderAddress, revealAddress, namespacePrice);
        });
        return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate(), preorderPromise])
            .then(function (_a) {
            var utxos = _a[0], feeRate = _a[1], preorderSkeleton = _a[2];
            var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(preorderSkeleton, network.layer1);
            txB.setVersion(1);
            var changeIndex = 1; // preorder skeleton always creates a change output at index = 1
            var signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0, changeIndex);
            return utils_1.signInputs(signingTxB, paymentKey);
        })
            .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
    });
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
function makeNamespaceReveal(namespace, revealAddress, paymentKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    if (!namespace.check()) {
        return Promise.reject(new Error('Invalid namespace'));
    }
    var namespaceRevealTX = skeletons_1.makeNamespaceRevealSkeleton(namespace, revealAddress);
    var paymentKey = getTransactionSigner(paymentKeyIn);
    return paymentKey.getAddress().then(function (preorderAddress) { return Promise.all([network.getUTXOs(preorderAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var txB = bitcoinjs_lib_1.default.TransactionBuilder
            .fromTransaction(namespaceRevealTX, network.layer1);
        txB.setVersion(1);
        var signingTxB = fundTransaction(txB, preorderAddress, utxos, feeRate, 0);
        return utils_1.signInputs(signingTxB, paymentKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeNamespaceReady(namespaceID, revealKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var namespaceReadyTX = skeletons_1.makeNamespaceReadySkeleton(namespaceID);
    var revealKey = getTransactionSigner(revealKeyIn);
    return revealKey.getAddress().then(function (revealAddress) { return Promise.all([network.getUTXOs(revealAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(namespaceReadyTX, network.layer1);
        txB.setVersion(1);
        var signingTxB = fundTransaction(txB, revealAddress, utxos, feeRate, 0);
        return utils_1.signInputs(signingTxB, revealKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeNameImport(name, recipientAddr, zonefileHash, importerKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var nameImportTX = skeletons_1.makeNameImportSkeleton(name, recipientAddr, zonefileHash);
    var importerKey = getTransactionSigner(importerKeyIn);
    return importerKey.getAddress().then(function (importerAddress) { return Promise.all([network.getUTXOs(importerAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(nameImportTX, network.layer1);
        var signingTxB = fundTransaction(txB, importerAddress, utxos, feeRate, 0);
        return utils_1.signInputs(signingTxB, importerKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeAnnounce(messageHash, senderKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var announceTX = skeletons_1.makeAnnounceSkeleton(messageHash);
    var senderKey = getTransactionSigner(senderKeyIn);
    return senderKey.getAddress().then(function (senderAddress) { return Promise.all([network.getUTXOs(senderAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(announceTX, network.layer1);
        var signingTxB = fundTransaction(txB, senderAddress, utxos, feeRate, 0);
        return utils_1.signInputs(signingTxB, senderKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeTokenTransfer(recipientAddress, tokenType, tokenAmount, scratchArea, senderKeyIn, btcFunderKeyIn, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    var network = config_1.config.network;
    var separateFunder = !!btcFunderKeyIn;
    var senderKey = getTransactionSigner(senderKeyIn);
    var btcKey = btcFunderKeyIn ? getTransactionSigner(btcFunderKeyIn) : senderKey;
    var txPromise = network.getConsensusHash()
        .then(function (consensusHash) { return skeletons_1.makeTokenTransferSkeleton(recipientAddress, consensusHash, tokenType, tokenAmount, scratchArea); });
    return Promise.all([senderKey.getAddress(), btcKey.getAddress()])
        .then(function (_a) {
        var senderAddress = _a[0], btcAddress = _a[1];
        var btcUTXOsPromise = separateFunder
            ? network.getUTXOs(btcAddress) : Promise.resolve([]);
        return Promise.all([
            network.getUTXOs(senderAddress),
            btcUTXOsPromise,
            network.getFeeRate(),
            txPromise
        ]).then(function (_a) {
            var senderUTXOs = _a[0], btcUTXOs = _a[1], feeRate = _a[2], tokenTransferTX = _a[3];
            var txB = bitcoinjs_lib_1.default.TransactionBuilder.fromTransaction(tokenTransferTX, network.layer1);
            if (separateFunder) {
                var payerInput = addOwnerInput(senderUTXOs, senderAddress, txB);
                var signingTxB = fundTransaction(txB, btcAddress, btcUTXOs, feeRate, payerInput.value);
                return utils_1.signInputs(signingTxB, btcKey, [{ index: payerInput.index, signer: senderKey }]);
            }
            else {
                var signingTxB = fundTransaction(txB, senderAddress, senderUTXOs, feeRate, 0);
                return utils_1.signInputs(signingTxB, senderKey);
            }
        });
    })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
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
function makeBitcoinSpend(destinationAddress, paymentKeyIn, amount, buildIncomplete) {
    if (buildIncomplete === void 0) { buildIncomplete = false; }
    if (amount <= 0) {
        return Promise.reject(new errors_1.InvalidParameterError('amount', 'amount must be greater than zero'));
    }
    var network = config_1.config.network;
    var paymentKey = getTransactionSigner(paymentKeyIn);
    return paymentKey.getAddress().then(function (paymentAddress) { return Promise.all([network.getUTXOs(paymentAddress), network.getFeeRate()])
        .then(function (_a) {
        var utxos = _a[0], feeRate = _a[1];
        var txB = new bitcoinjs_lib_1.default.TransactionBuilder(network.layer1);
        txB.setVersion(1);
        var destinationIndex = txB.addOutput(destinationAddress, 0);
        // will add utxos up to _amount_ and return the amount of leftover _change_
        var change;
        try {
            change = utils_1.addUTXOsToFund(txB, utxos, amount, feeRate, false);
        }
        catch (err) {
            if (err.name === 'NotEnoughFundsError') {
                // actual amount funded = amount requested - remainder
                amount -= err.leftToFund;
                change = 0;
            }
            else {
                throw err;
            }
        }
        var feesToPay = feeRate * utils_1.estimateTXBytes(txB, 0, 0);
        var feeForChange = feeRate * (utils_1.estimateTXBytes(txB, 0, 1)) - feesToPay;
        // it's worthwhile to add a change output
        if (change > feeForChange) {
            feesToPay += feeForChange;
            txB.addOutput(paymentAddress, change);
        }
        // now let's compute how much output is leftover once we pay the fees.
        var outputAmount = amount - feesToPay;
        if (outputAmount < utils_1.DUST_MINIMUM) {
            throw new errors_1.InvalidAmountError(feesToPay, amount);
        }
        // we need to manually set the output values now
        var txInner = utils_1.getTransactionInsideBuilder(txB);
        txInner.outs[destinationIndex].value = outputAmount;
        // ready to sign.
        return utils_1.signInputs(txB, paymentKey);
    }); })
        .then(function (signingTxB) { return returnTransactionHex(signingTxB, buildIncomplete); });
}
exports.transactions = {
    makeRenewal: makeRenewal,
    makeUpdate: makeUpdate,
    makePreorder: makePreorder,
    makeRegister: makeRegister,
    makeTransfer: makeTransfer,
    makeRevoke: makeRevoke,
    makeNamespacePreorder: makeNamespacePreorder,
    makeNamespaceReveal: makeNamespaceReveal,
    makeNamespaceReady: makeNamespaceReady,
    makeBitcoinSpend: makeBitcoinSpend,
    makeNameImport: makeNameImport,
    makeAnnounce: makeAnnounce,
    makeTokenTransfer: makeTokenTransfer,
    BlockstackNamespace: skeletons_1.BlockstackNamespace,
    estimatePreorder: estimatePreorder,
    estimateRegister: estimateRegister,
    estimateTransfer: estimateTransfer,
    estimateUpdate: estimateUpdate,
    estimateRenewal: estimateRenewal,
    estimateRevoke: estimateRevoke,
    estimateNamespacePreorder: estimateNamespacePreorder,
    estimateNamespaceReveal: estimateNamespaceReveal,
    estimateNamespaceReady: estimateNamespaceReady,
    estimateNameImport: estimateNameImport,
    estimateAnnounce: estimateAnnounce,
    estimateTokenTransfer: estimateTokenTransfer
};
//# sourceMappingURL=txbuild.js.map