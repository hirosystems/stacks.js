import BN from 'bn.js';
import { BlockstackNamespace } from './skeletons';
import { TransactionSigner } from './signers';
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
declare function estimatePreorder(fullyQualifiedName: string, destinationAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
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
declare function estimateRegister(fullyQualifiedName: string, registerAddress: string, paymentAddress: string, includingZonefile?: boolean, paymentUtxos?: number): Promise<number>;
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
declare function estimateUpdate(fullyQualifiedName: string, ownerAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
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
declare function estimateTransfer(fullyQualifiedName: string, destinationAddress: string, ownerAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
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
declare function estimateRenewal(fullyQualifiedName: string, destinationAddress: string, ownerAddress: string, paymentAddress: string, includingZonefile?: boolean, paymentUtxos?: number): Promise<number>;
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
declare function estimateRevoke(fullyQualifiedName: string, ownerAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
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
declare function estimateNamespacePreorder(namespaceID: string, revealAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
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
declare function estimateNamespaceReveal(namespace: BlockstackNamespace, revealAddress: string, paymentAddress: string, paymentUtxos?: number): Promise<number>;
/**
 * Estimates the cost of a namespace-ready transaction for a namespace
 * @param {String} namespaceID - the namespace to ready
 * @param {Number} revealUtxos - the number of UTXOs we expect will
 *  be required from the reveal address
 * @returns {Promise} - a promise which resolves to the satoshi cost to
 *  fund this namespacey-ready transaction.
 * @private
 */
declare function estimateNamespaceReady(namespaceID: string, revealUtxos?: number): Promise<number>;
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
declare function estimateNameImport(name: string, recipientAddr: string, zonefileHash: string, importUtxos?: number): Promise<number>;
/**
 * Estimates the cost of an announce transaction
 * @param {String} messageHash - the hash of the message
 * @param {Number} senderUtxos - the number of utxos we expect will
 *  be required from the importer address
 * @returns {Promise} - a promise which resolves to the satoshi cost
 *  to fund this announce transaction
 * @private
 */
declare function estimateAnnounce(messageHash: string, senderUtxos?: number): Promise<number>;
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
declare function estimateTokenTransfer(recipientAddress: string, tokenType: string, tokenAmount: BN, scratchArea: string, senderUtxos?: number, additionalOutputs?: number): Promise<number>;
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
declare function makePreorder(fullyQualifiedName: string, destinationAddress: string, paymentKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeUpdate(fullyQualifiedName: string, ownerKeyIn: string | TransactionSigner, paymentKeyIn: string | TransactionSigner, zonefile: string, valueHash?: string, buildIncomplete?: boolean): Promise<string>;
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
declare function makeRegister(fullyQualifiedName: string, registerAddress: string, paymentKeyIn: string | TransactionSigner, zonefile?: string, valueHash?: string, buildIncomplete?: boolean): Promise<string>;
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
declare function makeTransfer(fullyQualifiedName: string, destinationAddress: string, ownerKeyIn: string | TransactionSigner, paymentKeyIn: string | TransactionSigner, keepZonefile?: boolean, buildIncomplete?: boolean): Promise<string>;
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
declare function makeRevoke(fullyQualifiedName: string, ownerKeyIn: string | TransactionSigner, paymentKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeRenewal(fullyQualifiedName: string, destinationAddress: string, ownerKeyIn: string | TransactionSigner, paymentKeyIn: string | TransactionSigner, zonefile?: string, valueHash?: string, buildIncomplete?: boolean): Promise<string>;
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
 */
declare function makeNamespacePreorder(namespaceID: string, revealAddress: string, paymentKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeNamespaceReveal(namespace: BlockstackNamespace, revealAddress: string, paymentKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeNamespaceReady(namespaceID: string, revealKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeNameImport(name: string, recipientAddr: string, zonefileHash: string, importerKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeAnnounce(messageHash: string, senderKeyIn: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeTokenTransfer(recipientAddress: string, tokenType: string, tokenAmount: BN, scratchArea: string, senderKeyIn: string | TransactionSigner, btcFunderKeyIn?: string | TransactionSigner, buildIncomplete?: boolean): Promise<string>;
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
declare function makeBitcoinSpend(destinationAddress: string, paymentKeyIn: string | TransactionSigner, amount: number, buildIncomplete?: boolean): Promise<string>;
export declare const transactions: {
    makeRenewal: typeof makeRenewal;
    makeUpdate: typeof makeUpdate;
    makePreorder: typeof makePreorder;
    makeRegister: typeof makeRegister;
    makeTransfer: typeof makeTransfer;
    makeRevoke: typeof makeRevoke;
    makeNamespacePreorder: typeof makeNamespacePreorder;
    makeNamespaceReveal: typeof makeNamespaceReveal;
    makeNamespaceReady: typeof makeNamespaceReady;
    makeBitcoinSpend: typeof makeBitcoinSpend;
    makeNameImport: typeof makeNameImport;
    makeAnnounce: typeof makeAnnounce;
    makeTokenTransfer: typeof makeTokenTransfer;
    BlockstackNamespace: typeof BlockstackNamespace;
    estimatePreorder: typeof estimatePreorder;
    estimateRegister: typeof estimateRegister;
    estimateTransfer: typeof estimateTransfer;
    estimateUpdate: typeof estimateUpdate;
    estimateRenewal: typeof estimateRenewal;
    estimateRevoke: typeof estimateRevoke;
    estimateNamespacePreorder: typeof estimateNamespacePreorder;
    estimateNamespaceReveal: typeof estimateNamespaceReveal;
    estimateNamespaceReady: typeof estimateNamespaceReady;
    estimateNameImport: typeof estimateNameImport;
    estimateAnnounce: typeof estimateAnnounce;
    estimateTokenTransfer: typeof estimateTokenTransfer;
};
export {};
