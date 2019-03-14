"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var form_data_1 = __importDefault(require("form-data"));
var bn_js_1 = __importDefault(require("bn.js"));
var ripemd160_1 = __importDefault(require("ripemd160"));
var errors_1 = require("./errors");
var logger_1 = require("./logger");
var SATOSHIS_PER_BTC = 1e8;
var TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT = 'zone-file';
var TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT = 'registration';
var TX_BROADCAST_SERVICE_TX_ENDPOINT = 'transaction';
/**
 * @private
 * @ignore
 */
var BitcoinNetwork = /** @class */ (function () {
    function BitcoinNetwork() {
    }
    BitcoinNetwork.prototype.broadcastTransaction = function (transaction) {
        return Promise.reject(new Error("Not implemented, broadcastTransaction(" + transaction + ")"));
    };
    BitcoinNetwork.prototype.getBlockHeight = function () {
        return Promise.reject(new Error('Not implemented, getBlockHeight()'));
    };
    BitcoinNetwork.prototype.getTransactionInfo = function (txid) {
        return Promise.reject(new Error("Not implemented, getTransactionInfo(" + txid + ")"));
    };
    BitcoinNetwork.prototype.getNetworkedUTXOs = function (address) {
        return Promise.reject(new Error("Not implemented, getNetworkedUTXOs(" + address + ")"));
    };
    return BitcoinNetwork;
}());
exports.BitcoinNetwork = BitcoinNetwork;
/**
 * @private
 * @ignore
 */
var BlockstackNetwork = /** @class */ (function () {
    function BlockstackNetwork(apiUrl, broadcastServiceUrl, bitcoinAPI, network) {
        if (network === void 0) { network = bitcoinjs_lib_1.default.networks.bitcoin; }
        this.blockstackAPIUrl = apiUrl;
        this.broadcastServiceUrl = broadcastServiceUrl;
        this.layer1 = network;
        this.btc = bitcoinAPI;
        this.DUST_MINIMUM = 5500;
        this.includeUtxoMap = {};
        this.excludeUtxoSet = [];
        this.MAGIC_BYTES = 'id';
    }
    BlockstackNetwork.prototype.coerceAddress = function (address) {
        var _a = bitcoinjs_lib_1.default.address.fromBase58Check(address), hash = _a.hash, version = _a.version;
        var scriptHashes = [bitcoinjs_lib_1.default.networks.bitcoin.scriptHash,
            bitcoinjs_lib_1.default.networks.testnet.scriptHash];
        var pubKeyHashes = [bitcoinjs_lib_1.default.networks.bitcoin.pubKeyHash,
            bitcoinjs_lib_1.default.networks.testnet.pubKeyHash];
        var coercedVersion;
        if (scriptHashes.indexOf(version) >= 0) {
            coercedVersion = this.layer1.scriptHash;
        }
        else if (pubKeyHashes.indexOf(version) >= 0) {
            coercedVersion = this.layer1.pubKeyHash;
        }
        else {
            throw new Error("Unrecognized address version number " + version + " in " + address);
        }
        return bitcoinjs_lib_1.default.address.toBase58Check(hash, coercedVersion);
    };
    /**
    * @ignore
    */
    BlockstackNetwork.prototype.getDefaultBurnAddress = function () {
        return this.coerceAddress('1111111111111111111114oLvT2');
    };
    /**
     * Get the price of a name via the legacy /v1/prices API endpoint.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    BlockstackNetwork.prototype.getNamePriceV1 = function (fullyQualifiedName) {
        var _this = this;
        // legacy code path
        return fetch(this.blockstackAPIUrl + "/v1/prices/names/" + fullyQualifiedName)
            .then(function (resp) {
            if (!resp.ok) {
                throw new Error("Failed to query name price for " + fullyQualifiedName);
            }
            return resp;
        })
            .then(function (resp) { return resp.json(); })
            .then(function (resp) { return resp.name_price; })
            .then(function (namePrice) {
            if (!namePrice || !namePrice.satoshis) {
                throw new Error("Failed to get price for " + fullyQualifiedName + ". Does the namespace exist?");
            }
            if (namePrice.satoshis < _this.DUST_MINIMUM) {
                namePrice.satoshis = _this.DUST_MINIMUM;
            }
            var result = {
                units: 'BTC',
                amount: new bn_js_1.default(String(namePrice.satoshis))
            };
            return result;
        });
    };
    /**
     * Get the price of a namespace via the legacy /v1/prices API endpoint.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    BlockstackNetwork.prototype.getNamespacePriceV1 = function (namespaceID) {
        var _this = this;
        // legacy code path
        return fetch(this.blockstackAPIUrl + "/v1/prices/namespaces/" + namespaceID)
            .then(function (resp) {
            if (!resp.ok) {
                throw new Error("Failed to query name price for " + namespaceID);
            }
            return resp;
        })
            .then(function (resp) { return resp.json(); })
            .then(function (namespacePrice) {
            if (!namespacePrice || !namespacePrice.satoshis) {
                throw new Error("Failed to get price for " + namespaceID);
            }
            if (namespacePrice.satoshis < _this.DUST_MINIMUM) {
                namespacePrice.satoshis = _this.DUST_MINIMUM;
            }
            var result = {
                units: 'BTC',
                amount: new bn_js_1.default(String(namespacePrice.satoshis))
            };
            return result;
        });
    };
    /**
     * Get the price of a name via the /v2/prices API endpoint.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    BlockstackNetwork.prototype.getNamePriceV2 = function (fullyQualifiedName) {
        var _this = this;
        return fetch(this.blockstackAPIUrl + "/v2/prices/names/" + fullyQualifiedName)
            .then(function (resp) {
            if (resp.status !== 200) {
                // old core node 
                throw new Error('The upstream node does not handle the /v2/ price namespace');
            }
            return resp;
        })
            .then(function (resp) { return resp.json(); })
            .then(function (resp) { return resp.name_price; })
            .then(function (namePrice) {
            if (!namePrice) {
                throw new Error("Failed to get price for " + fullyQualifiedName + ". Does the namespace exist?");
            }
            var result = {
                units: namePrice.units,
                amount: new bn_js_1.default(namePrice.amount)
            };
            if (namePrice.units === 'BTC') {
                // must be at least dust-minimum
                var dustMin = new bn_js_1.default(String(_this.DUST_MINIMUM));
                if (result.amount.ucmp(dustMin) < 0) {
                    result.amount = dustMin;
                }
            }
            return result;
        });
    };
    /**
     * Get the price of a namespace via the /v2/prices API endpoint.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    BlockstackNetwork.prototype.getNamespacePriceV2 = function (namespaceID) {
        var _this = this;
        return fetch(this.blockstackAPIUrl + "/v2/prices/namespaces/" + namespaceID)
            .then(function (resp) {
            if (resp.status !== 200) {
                // old core node 
                throw new Error('The upstream node does not handle the /v2/ price namespace');
            }
            return resp;
        })
            .then(function (resp) { return resp.json(); })
            .then(function (namespacePrice) {
            if (!namespacePrice) {
                throw new Error("Failed to get price for " + namespaceID);
            }
            var result = {
                units: namespacePrice.units,
                amount: new bn_js_1.default(namespacePrice.amount)
            };
            if (namespacePrice.units === 'BTC') {
                // must be at least dust-minimum
                var dustMin = new bn_js_1.default(String(_this.DUST_MINIMUM));
                if (result.amount.ucmp(dustMin) < 0) {
                    result.amount = dustMin;
                }
            }
            return result;
        });
    };
    /**
     * Get the price of a name.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
     *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
     *   .amount encodes the number of units, in the smallest denominiated amount
     *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS,
     *   .amount will be microStacks)
     */
    BlockstackNetwork.prototype.getNamePrice = function (fullyQualifiedName) {
        var _this = this;
        // handle v1 or v2 
        return Promise.resolve().then(function () { return _this.getNamePriceV2(fullyQualifiedName); })
            .catch(function () { return _this.getNamePriceV1(fullyQualifiedName); });
    };
    /**
     * Get the price of a namespace
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
     *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
     *   .amount encodes the number of units, in the smallest denominiated amount
     *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS,
     *   .amount will be microStacks)
     */
    BlockstackNetwork.prototype.getNamespacePrice = function (namespaceID) {
        var _this = this;
        // handle v1 or v2 
        return Promise.resolve().then(function () { return _this.getNamespacePriceV2(namespaceID); })
            .catch(function () { return _this.getNamespacePriceV1(namespaceID); });
    };
    /**
     * How many blocks can pass between a name expiring and the name being able to be
     * re-registered by a different owner?
     * @param {string} fullyQualifiedName unused
     * @return {Promise} a promise to the number of blocks
     */
    BlockstackNetwork.prototype.getGracePeriod = function (fullyQualifiedName) {
        return Promise.resolve(5000);
    };
    /**
     * Get the names -- both on-chain and off-chain -- owned by an address.
     * @param {String} address the blockchain address (the hash of the owner public key)
     * @return {Promise} a promise that resolves to a list of names (Strings)
     */
    BlockstackNetwork.prototype.getNamesOwned = function (address) {
        var networkAddress = this.coerceAddress(address);
        return fetch(this.blockstackAPIUrl + "/v1/addresses/bitcoin/" + networkAddress)
            .then(function (resp) { return resp.json(); })
            .then(function (obj) { return obj.names; });
    };
    /**
     * Get the blockchain address to which a name's registration fee must be sent
     * (the address will depend on the namespace in which it is registered.)
     * @param {String} namespace the namespace ID
     * @return {Promise} a promise that resolves to an address (String)
     */
    BlockstackNetwork.prototype.getNamespaceBurnAddress = function (namespace) {
        var _this = this;
        return Promise.all([
            fetch(this.blockstackAPIUrl + "/v1/namespaces/" + namespace),
            this.getBlockHeight()
        ])
            .then(function (_a) {
            var resp = _a[0], blockHeight = _a[1];
            if (resp.status === 404) {
                throw new Error("No such namespace '" + namespace + "'");
            }
            else {
                return Promise.all([resp.json(), blockHeight]);
            }
        })
            .then(function (_a) {
            var namespaceInfo = _a[0], blockHeight = _a[1];
            var address = _this.getDefaultBurnAddress();
            if (namespaceInfo.version === 2) {
                // pay-to-namespace-creator if this namespace is less than 1 year old
                if (namespaceInfo.reveal_block + 52595 >= blockHeight) {
                    address = namespaceInfo.address;
                }
            }
            return address;
        })
            .then(function (address) { return _this.coerceAddress(address); });
    };
    /**
     * Get WHOIS-like information for a name, including the address that owns it,
     * the block at which it expires, and the zone file anchored to it (if available).
     * @param {String} fullyQualifiedName the name to query.  Can be on-chain of off-chain.
     * @return {Promise} a promise that resolves to the WHOIS-like information
     */
    BlockstackNetwork.prototype.getNameInfo = function (fullyQualifiedName) {
        var _this = this;
        logger_1.Logger.debug(this.blockstackAPIUrl);
        var nameLookupURL = this.blockstackAPIUrl + "/v1/names/" + fullyQualifiedName;
        return fetch(nameLookupURL)
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Name not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (nameInfo) {
            logger_1.Logger.debug("nameInfo: " + JSON.stringify(nameInfo));
            // the returned address _should_ be in the correct network ---
            //  blockstackd gets into trouble because it tries to coerce back to mainnet
            //  and the regtest transaction generation libraries want to use testnet addresses
            if (nameInfo.address) {
                return Object.assign({}, nameInfo, { address: _this.coerceAddress(nameInfo.address) });
            }
            else {
                return nameInfo;
            }
        });
    };
    /**
     * Get the pricing parameters and creation history of a namespace.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise that resolves to the namespace information.
     */
    BlockstackNetwork.prototype.getNamespaceInfo = function (namespaceID) {
        var _this = this;
        return fetch(this.blockstackAPIUrl + "/v1/namespaces/" + namespaceID)
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Namespace not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (namespaceInfo) {
            // the returned address _should_ be in the correct network ---
            //  blockstackd gets into trouble because it tries to coerce back to mainnet
            //  and the regtest transaction generation libraries want to use testnet addresses
            if (namespaceInfo.address && namespaceInfo.recipient_address) {
                return Object.assign({}, namespaceInfo, {
                    address: _this.coerceAddress(namespaceInfo.address),
                    recipient_address: _this.coerceAddress(namespaceInfo.recipient_address)
                });
            }
            else {
                return namespaceInfo;
            }
        });
    };
    /**
     * Get a zone file, given its hash.  Throws an exception if the zone file
     * obtained does not match the hash.
     * @param {String} zonefileHash the ripemd160(sha256) hash of the zone file
     * @return {Promise} a promise that resolves to the zone file's text
     */
    BlockstackNetwork.prototype.getZonefile = function (zonefileHash) {
        return fetch(this.blockstackAPIUrl + "/v1/zonefiles/" + zonefileHash)
            .then(function (resp) {
            if (resp.status === 200) {
                return resp.text()
                    .then(function (body) {
                    var sha256 = bitcoinjs_lib_1.default.crypto.sha256(Buffer.from(body));
                    var h = (new ripemd160_1.default()).update(sha256).digest('hex');
                    if (h !== zonefileHash) {
                        throw new Error("Zone file contents hash to " + h + ", not " + zonefileHash);
                    }
                    return body;
                });
            }
            else {
                throw new Error("Bad response status: " + resp.status);
            }
        });
    };
    /**
     * Get the status of an account for a particular token holding.  This includes its total number of
     * expenditures and credits, lockup times, last txid, and so on.
     * @param {String} address the account
     * @param {String} tokenType the token type to query
     * @return {Promise} a promise that resolves to an object representing the state of the account
     *   for this token
     */
    BlockstackNetwork.prototype.getAccountStatus = function (address, tokenType) {
        var _this = this;
        return fetch(this.blockstackAPIUrl + "/v1/accounts/" + address + "/" + tokenType + "/status")
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Account not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        }).then(function (accountStatus) {
            // coerce all addresses, and convert credit/debit to biginteger
            var formattedStatus = Object.assign({}, accountStatus, {
                address: _this.coerceAddress(accountStatus.address),
                debit_value: new bn_js_1.default(String(accountStatus.debit_value)),
                credit_value: new bn_js_1.default(String(accountStatus.credit_value))
            });
            return formattedStatus;
        });
    };
    /**
     * Get a page of an account's transaction history.
     * @param {String} address the account's address
     * @param {number} page the page number.  Page 0 is the most recent transactions
     * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
     *   states of the account at various block heights (e.g. prior balances, txids, etc)
     */
    BlockstackNetwork.prototype.getAccountHistoryPage = function (address, page) {
        var _this = this;
        var url = this.blockstackAPIUrl + "/v1/accounts/" + address + "/history?page=" + page;
        return fetch(url)
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Account not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (historyList) {
            if (historyList.error) {
                throw new Error("Unable to get account history page: " + historyList.error);
            }
            // coerse all addresses and convert to bigint
            return historyList.map(function (histEntry) {
                histEntry.address = _this.coerceAddress(histEntry.address);
                histEntry.debit_value = new bn_js_1.default(String(histEntry.debit_value));
                histEntry.credit_value = new bn_js_1.default(String(histEntry.credit_value));
                return histEntry;
            });
        });
    };
    /**
     * Get the state(s) of an account at a particular block height.  This includes the state of the
     * account beginning with this block's transactions, as well as all of the states the account
     * passed through when this block was processed (if any).
     * @param {String} address the account's address
     * @param {Integer} blockHeight the block to query
     * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
     *   states of the account at this block.
     */
    BlockstackNetwork.prototype.getAccountAt = function (address, blockHeight) {
        var _this = this;
        var url = this.blockstackAPIUrl + "/v1/accounts/" + address + "/history/" + blockHeight;
        return fetch(url)
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Account not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (historyList) {
            if (historyList.error) {
                throw new Error("Unable to get historic account state: " + historyList.error);
            }
            // coerce all addresses 
            return historyList.map(function (histEntry) {
                histEntry.address = _this.coerceAddress(histEntry.address);
                histEntry.debit_value = new bn_js_1.default(String(histEntry.debit_value));
                histEntry.credit_value = new bn_js_1.default(String(histEntry.credit_value));
                return histEntry;
            });
        });
    };
    /**
     * Get the set of token types that this account owns
     * @param {String} address the account's address
     * @return {Promise} a promise that resolves to an Array of Strings, where each item encodes the
     *   type of token this account holds (excluding the underlying blockchain's tokens)
     */
    BlockstackNetwork.prototype.getAccountTokens = function (address) {
        return fetch(this.blockstackAPIUrl + "/v1/accounts/" + address + "/tokens")
            .then(function (resp) {
            if (resp.status === 404) {
                throw new Error('Account not found');
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (tokenList) {
            if (tokenList.error) {
                throw new Error("Unable to get token list: " + tokenList.error);
            }
            return tokenList;
        });
    };
    /**
     * Get the number of tokens owned by an account.  If the account does not exist or has no
     * tokens of this type, then 0 will be returned.
     * @param {String} address the account's address
     * @param {String} tokenType the type of token to query.
     * @return {Promise} a promise that resolves to a BigInteger that encodes the number of tokens
     *   held by this account.
     */
    BlockstackNetwork.prototype.getAccountBalance = function (address, tokenType) {
        return fetch(this.blockstackAPIUrl + "/v1/accounts/" + address + "/" + tokenType + "/balance")
            .then(function (resp) {
            if (resp.status === 404) {
                // talking to an older blockstack core node without the accounts API
                return Promise.resolve().then(function () { return new bn_js_1.default('0'); });
            }
            else if (resp.status !== 200) {
                throw new Error("Bad response status: " + resp.status);
            }
            else {
                return resp.json();
            }
        })
            .then(function (tokenBalance) {
            if (tokenBalance.error) {
                throw new Error("Unable to get account balance: " + tokenBalance.error);
            }
            var balance = '0';
            if (tokenBalance && tokenBalance.balance) {
                balance = tokenBalance.balance;
            }
            return new bn_js_1.default(balance);
        });
    };
    /**
     * Performs a POST request to the given URL
     * @param  {String} endpoint  the name of
     * @param  {String} body [description]
     * @return {Promise<Object|Error>} Returns a `Promise` that resolves to the object requested.
     * In the event of an error, it rejects with:
     * * a `RemoteServiceError` if there is a problem
     * with the transaction broadcast service
     * * `MissingParameterError` if you call the function without a required
     * parameter
     *
     * @private
     */
    BlockstackNetwork.prototype.broadcastServiceFetchHelper = function (endpoint, body) {
        var requestHeaders = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };
        var options = {
            method: 'POST',
            headers: requestHeaders,
            body: JSON.stringify(body)
        };
        var url = this.broadcastServiceUrl + "/v1/broadcast/" + endpoint;
        return fetch(url, options)
            .then(function (response) {
            if (response.ok) {
                return response.json();
            }
            else {
                throw new errors_1.RemoteServiceError(response);
            }
        });
    };
    /**
    * Broadcasts a signed bitcoin transaction to the network optionally waiting to broadcast the
    * transaction until a second transaction has a certain number of confirmations.
    *
    * @param  {string} transaction the hex-encoded transaction to broadcast
    * @param  {string} transactionToWatch the hex transaction id of the transaction to watch for
    * the specified number of confirmations before broadcasting the `transaction`
    * @param  {number} confirmations the number of confirmations `transactionToWatch` must have
    * before broadcasting `transaction`.
    * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
    * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
    *
    * In the event of an error, it rejects with:
    * * a `RemoteServiceError` if there is a problem
    *   with the transaction broadcast service
    * * `MissingParameterError` if you call the function without a required
    *   parameter
    * @private
    */
    BlockstackNetwork.prototype.broadcastTransaction = function (transaction, transactionToWatch, confirmations) {
        if (transactionToWatch === void 0) { transactionToWatch = null; }
        if (confirmations === void 0) { confirmations = 6; }
        if (!transaction) {
            var error = new errors_1.MissingParameterError('transaction');
            return Promise.reject(error);
        }
        if (!confirmations && confirmations !== 0) {
            var error = new errors_1.MissingParameterError('confirmations');
            return Promise.reject(error);
        }
        if (transactionToWatch === null) {
            return this.btc.broadcastTransaction(transaction);
        }
        else {
            /*
             * POST /v1/broadcast/transaction
             * Request body:
             * JSON.stringify({
             *  transaction,
             *  transactionToWatch,
             *  confirmations
             * })
             */
            var endpoint = TX_BROADCAST_SERVICE_TX_ENDPOINT;
            var requestBody = {
                transaction: transaction,
                transactionToWatch: transactionToWatch,
                confirmations: confirmations
            };
            return this.broadcastServiceFetchHelper(endpoint, requestBody);
        }
    };
    /**
     * Broadcasts a zone file to the Atlas network via the transaction broadcast service.
     *
     * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
     * @param  {String} transactionToWatch the hex transaction id of the transaction
     * to watch for confirmation before broadcasting the zone file to the Atlas network
     * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
     * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
     *
     * In the event of an error, it rejects with:
     * * a `RemoteServiceError` if there is a problem
     *   with the transaction broadcast service
     * * `MissingParameterError` if you call the function without a required
     *   parameter
     * @private
     */
    BlockstackNetwork.prototype.broadcastZoneFile = function (zoneFile, transactionToWatch) {
        if (transactionToWatch === void 0) { transactionToWatch = null; }
        if (!zoneFile) {
            return Promise.reject(new errors_1.MissingParameterError('zoneFile'));
        }
        // TODO: validate zonefile
        if (transactionToWatch) {
            // broadcast via transaction broadcast service
            /*
             * POST /v1/broadcast/zone-file
             * Request body:
             * JSON.stringify({
             *  zoneFile,
             *  transactionToWatch
             * })
             */
            var requestBody = {
                zoneFile: zoneFile,
                transactionToWatch: transactionToWatch
            };
            var endpoint = TX_BROADCAST_SERVICE_ZONE_FILE_ENDPOINT;
            return this.broadcastServiceFetchHelper(endpoint, requestBody);
        }
        else {
            // broadcast via core endpoint
            // zone file is two words but core's api treats it as one word 'zonefile'
            var requestBody = { zonefile: zoneFile };
            return fetch(this.blockstackAPIUrl + "/v1/zonefile/", {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(function (resp) {
                var json = resp.json();
                return json
                    .then(function (respObj) {
                    if (respObj.hasOwnProperty('error')) {
                        throw new errors_1.RemoteServiceError(resp);
                    }
                    return respObj.servers;
                });
            });
        }
    };
    /**
     * Sends the preorder and registration transactions and zone file
     * for a Blockstack name registration
     * along with the to the transaction broadcast service.
     *
     * The transaction broadcast:
     *
     * * immediately broadcasts the preorder transaction
     * * broadcasts the register transactions after the preorder transaction
     * has an appropriate number of confirmations
     * * broadcasts the zone file to the Atlas network after the register transaction
     * has an appropriate number of confirmations
     *
     * @param  {String} preorderTransaction the hex-encoded, signed preorder transaction generated
     * using the `makePreorder` function
     * @param  {String} registerTransaction the hex-encoded, signed register transaction generated
     * using the `makeRegister` function
     * @param  {String} zoneFile the zone file to be broadcast to the Atlas network
     * @return {Promise<Object|Error>} Returns a Promise that resolves to an object with a
     * `transaction_hash` key containing the transaction hash of the broadcasted transaction.
     *
     * In the event of an error, it rejects with:
     * * a `RemoteServiceError` if there is a problem
     *   with the transaction broadcast service
     * * `MissingParameterError` if you call the function without a required
     *   parameter
     * @private
     */
    BlockstackNetwork.prototype.broadcastNameRegistration = function (preorderTransaction, registerTransaction, zoneFile) {
        /*
           * POST /v1/broadcast/registration
           * Request body:
           * JSON.stringify({
           * preorderTransaction,
           * registerTransaction,
           * zoneFile
           * })
           */
        if (!preorderTransaction) {
            var error = new errors_1.MissingParameterError('preorderTransaction');
            return Promise.reject(error);
        }
        if (!registerTransaction) {
            var error = new errors_1.MissingParameterError('registerTransaction');
            return Promise.reject(error);
        }
        if (!zoneFile) {
            var error = new errors_1.MissingParameterError('zoneFile');
            return Promise.reject(error);
        }
        var requestBody = {
            preorderTransaction: preorderTransaction,
            registerTransaction: registerTransaction,
            zoneFile: zoneFile
        };
        var endpoint = TX_BROADCAST_SERVICE_REGISTRATION_ENDPOINT;
        return this.broadcastServiceFetchHelper(endpoint, requestBody);
    };
    /**
     * @ignore
     */
    BlockstackNetwork.prototype.getFeeRate = function () {
        return fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended')
            .then(function (resp) { return resp.json(); })
            .then(function (rates) { return Math.floor(rates.fastestFee); });
    };
    /**
     * @ignore
     */
    BlockstackNetwork.prototype.countDustOutputs = function () {
        throw new Error('Not implemented.');
    };
    /**
     * @ignore
     */
    BlockstackNetwork.prototype.getUTXOs = function (address) {
        var _this = this;
        return this.getNetworkedUTXOs(address)
            .then(function (networkedUTXOs) {
            var returnSet = networkedUTXOs.concat();
            if (_this.includeUtxoMap.hasOwnProperty(address)) {
                returnSet = networkedUTXOs.concat(_this.includeUtxoMap[address]);
            }
            // aaron: I am *well* aware this is O(n)*O(m) runtime
            //    however, clients should clear the exclude set periodically
            var excludeSet = _this.excludeUtxoSet;
            returnSet = returnSet.filter(function (utxo) {
                var inExcludeSet = excludeSet.reduce(function (inSet, utxoToCheck) { return inSet || (utxoToCheck.tx_hash === utxo.tx_hash
                    && utxoToCheck.tx_output_n === utxo.tx_output_n); }, false);
                return !inExcludeSet;
            });
            return returnSet;
        });
    };
    /**
     * This will modify the network's utxo set to include UTXOs
     *  from the given transaction and exclude UTXOs *spent* in
     *  that transaction
     * @param {String} txHex - the hex-encoded transaction to use
     * @return {void} no return value, this modifies the UTXO config state
     * @private
     * @ignore
     */
    BlockstackNetwork.prototype.modifyUTXOSetFrom = function (txHex) {
        var _this = this;
        var tx = bitcoinjs_lib_1.default.Transaction.fromHex(txHex);
        var excludeSet = this.excludeUtxoSet.concat();
        tx.ins.forEach(function (utxoUsed) {
            var reverseHash = Buffer.from(utxoUsed.hash);
            reverseHash.reverse();
            excludeSet.push({
                tx_hash: reverseHash.toString('hex'),
                tx_output_n: utxoUsed.index
            });
        });
        this.excludeUtxoSet = excludeSet;
        var txHash = Buffer.from(tx.getHash().reverse()).toString('hex');
        tx.outs.forEach(function (utxoCreated, txOutputN) {
            var isNullData = function isNullData(script) {
                try {
                    bitcoinjs_lib_1.default.payments.embed({ output: script }, { validate: true });
                    return true;
                }
                catch (_) {
                    return false;
                }
            };
            if (isNullData(utxoCreated.script)) {
                return;
            }
            var address = bitcoinjs_lib_1.default.address.fromOutputScript(utxoCreated.script, _this.layer1);
            var includeSet = [];
            if (_this.includeUtxoMap.hasOwnProperty(address)) {
                includeSet = includeSet.concat(_this.includeUtxoMap[address]);
            }
            includeSet.push({
                tx_hash: txHash,
                confirmations: 0,
                value: utxoCreated.value,
                tx_output_n: txOutputN
            });
            _this.includeUtxoMap[address] = includeSet;
        });
    };
    BlockstackNetwork.prototype.resetUTXOs = function (address) {
        delete this.includeUtxoMap[address];
        this.excludeUtxoSet = [];
    };
    /**
    * @ignore
    */
    BlockstackNetwork.prototype.getConsensusHash = function () {
        return fetch(this.blockstackAPIUrl + "/v1/blockchains/bitcoin/consensus")
            .then(function (resp) { return resp.json(); })
            .then(function (x) { return x.consensus_hash; });
    };
    BlockstackNetwork.prototype.getTransactionInfo = function (txHash) {
        return this.btc.getTransactionInfo(txHash);
    };
    /**
     * @ignore
     */
    BlockstackNetwork.prototype.getBlockHeight = function () {
        return this.btc.getBlockHeight();
    };
    BlockstackNetwork.prototype.getNetworkedUTXOs = function (address) {
        return this.btc.getNetworkedUTXOs(address);
    };
    return BlockstackNetwork;
}());
exports.BlockstackNetwork = BlockstackNetwork;
var LocalRegtest = /** @class */ (function (_super) {
    __extends(LocalRegtest, _super);
    function LocalRegtest(apiUrl, broadcastServiceUrl, bitcoinAPI) {
        return _super.call(this, apiUrl, broadcastServiceUrl, bitcoinAPI, bitcoinjs_lib_1.default.networks.testnet) || this;
    }
    LocalRegtest.prototype.getFeeRate = function () {
        return Promise.resolve(Math.floor(0.00001000 * SATOSHIS_PER_BTC));
    };
    return LocalRegtest;
}(BlockstackNetwork));
exports.LocalRegtest = LocalRegtest;
var BitcoindAPI = /** @class */ (function (_super) {
    __extends(BitcoindAPI, _super);
    function BitcoindAPI(bitcoindUrl, bitcoindCredentials) {
        var _this = _super.call(this) || this;
        _this.bitcoindUrl = bitcoindUrl;
        _this.bitcoindCredentials = bitcoindCredentials;
        _this.importedBefore = {};
        return _this;
    }
    BitcoindAPI.prototype.broadcastTransaction = function (transaction) {
        var jsonRPC = {
            jsonrpc: '1.0',
            method: 'sendrawtransaction',
            params: [transaction]
        };
        var authString = Buffer.from(this.bitcoindCredentials.username + ":" + this.bitcoindCredentials.password)
            .toString('base64');
        var headers = { Authorization: "Basic " + authString };
        return fetch(this.bitcoindUrl, {
            method: 'POST',
            body: JSON.stringify(jsonRPC),
            headers: headers
        })
            .then(function (resp) { return resp.json(); })
            .then(function (respObj) { return respObj.result; });
    };
    BitcoindAPI.prototype.getBlockHeight = function () {
        var jsonRPC = {
            jsonrpc: '1.0',
            method: 'getblockcount'
        };
        var authString = Buffer.from(this.bitcoindCredentials.username + ":" + this.bitcoindCredentials.password)
            .toString('base64');
        var headers = { Authorization: "Basic " + authString };
        return fetch(this.bitcoindUrl, {
            method: 'POST',
            body: JSON.stringify(jsonRPC),
            headers: headers
        })
            .then(function (resp) { return resp.json(); })
            .then(function (respObj) { return respObj.result; });
    };
    BitcoindAPI.prototype.getTransactionInfo = function (txHash) {
        var _this = this;
        var jsonRPC = {
            jsonrpc: '1.0',
            method: 'gettransaction',
            params: [txHash]
        };
        var authString = Buffer.from(this.bitcoindCredentials.username + ":" + this.bitcoindCredentials.password)
            .toString('base64');
        var headers = { Authorization: "Basic " + authString };
        return fetch(this.bitcoindUrl, {
            method: 'POST',
            body: JSON.stringify(jsonRPC),
            headers: headers
        })
            .then(function (resp) { return resp.json(); })
            .then(function (respObj) { return respObj.result; })
            .then(function (txInfo) { return txInfo.blockhash; })
            .then(function (blockhash) {
            var jsonRPCBlock = {
                jsonrpc: '1.0',
                method: 'getblockheader',
                params: [blockhash]
            };
            headers.Authorization = "Basic " + authString;
            return fetch(_this.bitcoindUrl, {
                method: 'POST',
                body: JSON.stringify(jsonRPCBlock),
                headers: headers
            });
        })
            .then(function (resp) { return resp.json(); })
            .then(function (respObj) {
            if (!respObj || !respObj.result) {
                // unconfirmed 
                throw new Error('Unconfirmed transaction');
            }
            else {
                return { block_height: respObj.result.height };
            }
        });
    };
    BitcoindAPI.prototype.getNetworkedUTXOs = function (address) {
        var _this = this;
        var jsonRPCImport = {
            jsonrpc: '1.0',
            method: 'importaddress',
            params: [address]
        };
        var jsonRPCUnspent = {
            jsonrpc: '1.0',
            method: 'listunspent',
            params: [0, 9999999, [address]]
        };
        var authString = Buffer.from(this.bitcoindCredentials.username + ":" + this.bitcoindCredentials.password)
            .toString('base64');
        var headers = { Authorization: "Basic " + authString };
        var importPromise = (this.importedBefore[address])
            ? Promise.resolve()
            : fetch(this.bitcoindUrl, {
                method: 'POST',
                body: JSON.stringify(jsonRPCImport),
                headers: headers
            })
                .then(function () { _this.importedBefore[address] = true; });
        return importPromise
            .then(function () { return fetch(_this.bitcoindUrl, {
            method: 'POST',
            body: JSON.stringify(jsonRPCUnspent),
            headers: headers
        }); })
            .then(function (resp) { return resp.json(); })
            .then(function (x) { return x.result; })
            .then(function (utxos) { return utxos.map(function (x) { return ({
            value: Math.round(x.amount * SATOSHIS_PER_BTC),
            confirmations: x.confirmations,
            tx_hash: x.txid,
            tx_output_n: x.vout
        }); }); });
    };
    return BitcoindAPI;
}(BitcoinNetwork));
exports.BitcoindAPI = BitcoindAPI;
var InsightClient = /** @class */ (function (_super) {
    __extends(InsightClient, _super);
    function InsightClient(insightUrl) {
        if (insightUrl === void 0) { insightUrl = 'https://utxo.technofractal.com/'; }
        var _this = _super.call(this) || this;
        _this.apiUrl = insightUrl;
        return _this;
    }
    InsightClient.prototype.broadcastTransaction = function (transaction) {
        var jsonData = { rawtx: transaction };
        return fetch(this.apiUrl + "/tx/send", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        })
            .then(function (resp) { return resp.json(); });
    };
    InsightClient.prototype.getBlockHeight = function () {
        return fetch(this.apiUrl + "/status")
            .then(function (resp) { return resp.json(); })
            .then(function (status) { return status.blocks; });
    };
    InsightClient.prototype.getTransactionInfo = function (txHash) {
        var _this = this;
        return fetch(this.apiUrl + "/tx/" + txHash)
            .then(function (resp) { return resp.json(); })
            .then(function (transactionInfo) {
            if (transactionInfo.error) {
                throw new Error("Error finding transaction: " + transactionInfo.error);
            }
            return fetch(_this.apiUrl + "/block/" + transactionInfo.blockHash);
        })
            .then(function (resp) { return resp.json(); })
            .then(function (blockInfo) { return ({ block_height: blockInfo.height }); });
    };
    InsightClient.prototype.getNetworkedUTXOs = function (address) {
        return fetch(this.apiUrl + "/addr/" + address + "/utxo")
            .then(function (resp) { return resp.json(); })
            .then(function (utxos) { return utxos.map(function (x) { return ({
            value: x.satoshis,
            confirmations: x.confirmations,
            tx_hash: x.txid,
            tx_output_n: x.vout
        }); }); });
    };
    return InsightClient;
}(BitcoinNetwork));
exports.InsightClient = InsightClient;
var BlockchainInfoApi = /** @class */ (function (_super) {
    __extends(BlockchainInfoApi, _super);
    function BlockchainInfoApi(blockchainInfoUrl) {
        if (blockchainInfoUrl === void 0) { blockchainInfoUrl = 'https://blockchain.info'; }
        var _this = _super.call(this) || this;
        _this.utxoProviderUrl = blockchainInfoUrl;
        return _this;
    }
    BlockchainInfoApi.prototype.getBlockHeight = function () {
        return fetch(this.utxoProviderUrl + "/latestblock?cors=true")
            .then(function (resp) { return resp.json(); })
            .then(function (blockObj) { return blockObj.height; });
    };
    BlockchainInfoApi.prototype.getNetworkedUTXOs = function (address) {
        return fetch(this.utxoProviderUrl + "/unspent?format=json&active=" + address + "&cors=true")
            .then(function (resp) {
            if (resp.status === 500) {
                logger_1.Logger.debug('UTXO provider 500 usually means no UTXOs: returning []');
                return {
                    unspent_outputs: []
                };
            }
            else {
                return resp.json();
            }
        })
            .then(function (utxoJSON) { return utxoJSON.unspent_outputs; })
            .then(function (utxoList) { return utxoList.map(function (utxo) {
            var utxoOut = {
                value: utxo.value,
                tx_output_n: utxo.tx_output_n,
                confirmations: utxo.confirmations,
                tx_hash: utxo.tx_hash_big_endian
            };
            return utxoOut;
        }); });
    };
    BlockchainInfoApi.prototype.getTransactionInfo = function (txHash) {
        return fetch(this.utxoProviderUrl + "/rawtx/" + txHash + "?cors=true")
            .then(function (resp) {
            if (resp.status === 200) {
                return resp.json();
            }
            else {
                throw new Error("Could not lookup transaction info for '" + txHash + "'. Server error.");
            }
        })
            .then(function (respObj) { return ({ block_height: respObj.block_height }); });
    };
    BlockchainInfoApi.prototype.broadcastTransaction = function (transaction) {
        var form = new form_data_1.default();
        form.append('tx', transaction);
        return fetch(this.utxoProviderUrl + "/pushtx?cors=true", {
            method: 'POST',
            body: form
        })
            .then(function (resp) {
            var text = resp.text();
            return text
                .then(function (respText) {
                if (respText.toLowerCase().indexOf('transaction submitted') >= 0) {
                    var txHash = Buffer.from(bitcoinjs_lib_1.default.Transaction.fromHex(transaction)
                        .getHash()
                        .reverse()).toString('hex'); // big_endian
                    return txHash;
                }
                else {
                    throw new errors_1.RemoteServiceError(resp, "Broadcast transaction failed with message: " + respText);
                }
            });
        });
    };
    return BlockchainInfoApi;
}(BitcoinNetwork));
exports.BlockchainInfoApi = BlockchainInfoApi;
/**
* @ignore
*/
var LOCAL_REGTEST = new LocalRegtest('http://localhost:16268', 'http://localhost:16269', new BitcoindAPI('http://localhost:18332/', { username: 'blockstack', password: 'blockstacksystem' }));
/**
* @ignore
*/
var MAINNET_DEFAULT = new BlockstackNetwork('https://core.blockstack.org', 'https://broadcast.blockstack.org', new BlockchainInfoApi());
/**
* @ignore
*/
exports.network = {
    BlockstackNetwork: BlockstackNetwork,
    LocalRegtest: LocalRegtest,
    BlockchainInfoApi: BlockchainInfoApi,
    BitcoindAPI: BitcoindAPI,
    InsightClient: InsightClient,
    defaults: { LOCAL_REGTEST: LOCAL_REGTEST, MAINNET_DEFAULT: MAINNET_DEFAULT }
};
//# sourceMappingURL=network.js.map