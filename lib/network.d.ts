import bitcoinjs from 'bitcoinjs-lib';
import BN from 'bn.js';
export declare type UTXO = {
    value?: number;
    confirmations?: number;
    tx_hash: string;
    tx_output_n: number;
};
export declare class BitcoinNetwork {
    broadcastTransaction(transaction: string): Promise<any>;
    getBlockHeight(): Promise<number>;
    getTransactionInfo(txid: string): Promise<{
        block_height: number;
    }>;
    getNetworkedUTXOs(address: string): Promise<Array<UTXO>>;
}
export declare class BlockstackNetwork {
    blockstackAPIUrl: string;
    broadcastServiceUrl: string;
    layer1: any;
    DUST_MINIMUM: number;
    includeUtxoMap: {
        [address: string]: UTXO[];
    };
    excludeUtxoSet: Array<UTXO>;
    btc: BitcoinNetwork;
    MAGIC_BYTES: string;
    constructor(apiUrl: string, broadcastServiceUrl: string, bitcoinAPI: BitcoinNetwork, network?: bitcoinjs.Network);
    coerceAddress(address: string): string;
    getDefaultBurnAddress(): string;
    /**
     * Get the price of a name via the legacy /v1/prices API endpoint.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    getNamePriceV1(fullyQualifiedName: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * Get the price of a namespace via the legacy /v1/prices API endpoint.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    getNamespacePriceV1(namespaceID: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * Get the price of a name via the /v2/prices API endpoint.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    getNamePriceV2(fullyQualifiedName: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * Get the price of a namespace via the /v2/prices API endpoint.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }
     * @private
     */
    getNamespacePriceV2(namespaceID: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * Get the price of a name.
     * @param {String} fullyQualifiedName the name to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
     *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
     *   .amount encodes the number of units, in the smallest denominiated amount
     *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS,
     *   .amount will be microStacks)
     */
    getNamePrice(fullyQualifiedName: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * Get the price of a namespace
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise to an Object with { units: String, amount: BigInteger }, where
     *   .units encodes the cryptocurrency units to pay (e.g. BTC, STACKS), and
     *   .amount encodes the number of units, in the smallest denominiated amount
     *   (e.g. if .units is BTC, .amount will be satoshis; if .units is STACKS,
     *   .amount will be microStacks)
     */
    getNamespacePrice(namespaceID: string): Promise<{
        units: string;
        amount: BN;
    }>;
    /**
     * How many blocks can pass between a name expiring and the name being able to be
     * re-registered by a different owner?
     * @param {string} fullyQualifiedName unused
     * @return {Promise} a promise to the number of blocks
     */
    getGracePeriod(fullyQualifiedName?: string): Promise<number>;
    /**
     * Get the names -- both on-chain and off-chain -- owned by an address.
     * @param {String} address the blockchain address (the hash of the owner public key)
     * @return {Promise} a promise that resolves to a list of names (Strings)
     */
    getNamesOwned(address: string): Promise<string[]>;
    /**
     * Get the blockchain address to which a name's registration fee must be sent
     * (the address will depend on the namespace in which it is registered.)
     * @param {String} namespace the namespace ID
     * @return {Promise} a promise that resolves to an address (String)
     */
    getNamespaceBurnAddress(namespace: string): Promise<string>;
    /**
     * Get WHOIS-like information for a name, including the address that owns it,
     * the block at which it expires, and the zone file anchored to it (if available).
     * @param {String} fullyQualifiedName the name to query.  Can be on-chain of off-chain.
     * @return {Promise} a promise that resolves to the WHOIS-like information
     */
    getNameInfo(fullyQualifiedName: string): Promise<any>;
    /**
     * Get the pricing parameters and creation history of a namespace.
     * @param {String} namespaceID the namespace to query
     * @return {Promise} a promise that resolves to the namespace information.
     */
    getNamespaceInfo(namespaceID: string): Promise<any>;
    /**
     * Get a zone file, given its hash.  Throws an exception if the zone file
     * obtained does not match the hash.
     * @param {String} zonefileHash the ripemd160(sha256) hash of the zone file
     * @return {Promise} a promise that resolves to the zone file's text
     */
    getZonefile(zonefileHash: string): Promise<string>;
    /**
     * Get the status of an account for a particular token holding.  This includes its total number of
     * expenditures and credits, lockup times, last txid, and so on.
     * @param {String} address the account
     * @param {String} tokenType the token type to query
     * @return {Promise} a promise that resolves to an object representing the state of the account
     *   for this token
     */
    getAccountStatus(address: string, tokenType: string): Promise<any>;
    /**
     * Get a page of an account's transaction history.
     * @param {String} address the account's address
     * @param {number} page the page number.  Page 0 is the most recent transactions
     * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
     *   states of the account at various block heights (e.g. prior balances, txids, etc)
     */
    getAccountHistoryPage(address: string, page: number): Promise<any[]>;
    /**
     * Get the state(s) of an account at a particular block height.  This includes the state of the
     * account beginning with this block's transactions, as well as all of the states the account
     * passed through when this block was processed (if any).
     * @param {String} address the account's address
     * @param {Integer} blockHeight the block to query
     * @return {Promise} a promise that resolves to an Array of Objects, where each Object encodes
     *   states of the account at this block.
     */
    getAccountAt(address: string, blockHeight: number): Promise<any[]>;
    /**
     * Get the set of token types that this account owns
     * @param {String} address the account's address
     * @return {Promise} a promise that resolves to an Array of Strings, where each item encodes the
     *   type of token this account holds (excluding the underlying blockchain's tokens)
     */
    getAccountTokens(address: string): Promise<string[]>;
    /**
     * Get the number of tokens owned by an account.  If the account does not exist or has no
     * tokens of this type, then 0 will be returned.
     * @param {String} address the account's address
     * @param {String} tokenType the type of token to query.
     * @return {Promise} a promise that resolves to a BigInteger that encodes the number of tokens
     *   held by this account.
     */
    getAccountBalance(address: string, tokenType: string): Promise<BN>;
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
    broadcastServiceFetchHelper(endpoint: string, body: any): Promise<any | Error>;
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
    broadcastTransaction(transaction: string, transactionToWatch?: string, confirmations?: number): Promise<any>;
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
    broadcastZoneFile(zoneFile?: string, transactionToWatch?: string): Promise<any>;
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
    broadcastNameRegistration(preorderTransaction: string, registerTransaction: string, zoneFile: string): Promise<any>;
    getFeeRate(): Promise<number>;
    countDustOutputs(): void;
    getUTXOs(address: string): Promise<Array<UTXO>>;
    /**
     * This will modify the network's utxo set to include UTXOs
     *  from the given transaction and exclude UTXOs *spent* in
     *  that transaction
     * @param {String} txHex - the hex-encoded transaction to use
     * @return {void} no return value, this modifies the UTXO config state
     * @private
     */
    modifyUTXOSetFrom(txHex: string): void;
    resetUTXOs(address: string): void;
    getConsensusHash(): Promise<any>;
    getTransactionInfo(txHash: string): Promise<{
        block_height: number;
    }>;
    getBlockHeight(): Promise<number>;
    getNetworkedUTXOs(address: string): Promise<Array<UTXO>>;
}
export declare class LocalRegtest extends BlockstackNetwork {
    constructor(apiUrl: string, broadcastServiceUrl: string, bitcoinAPI: BitcoinNetwork);
    getFeeRate(): Promise<number>;
}
export declare class BitcoindAPI extends BitcoinNetwork {
    bitcoindUrl: string;
    bitcoindCredentials: {
        username: string;
        password: string;
    };
    importedBefore: any;
    constructor(bitcoindUrl: string, bitcoindCredentials: {
        username: string;
        password: string;
    });
    broadcastTransaction(transaction: string): Promise<any>;
    getBlockHeight(): Promise<any>;
    getTransactionInfo(txHash: string): Promise<{
        block_height: number;
    }>;
    getNetworkedUTXOs(address: string): Promise<Array<UTXO>>;
}
export declare class InsightClient extends BitcoinNetwork {
    apiUrl: string;
    constructor(insightUrl?: string);
    broadcastTransaction(transaction: string): Promise<any>;
    getBlockHeight(): Promise<any>;
    getTransactionInfo(txHash: string): Promise<{
        block_height: number;
    }>;
    getNetworkedUTXOs(address: string): Promise<Array<UTXO>>;
}
export declare class BlockchainInfoApi extends BitcoinNetwork {
    utxoProviderUrl: string;
    constructor(blockchainInfoUrl?: string);
    getBlockHeight(): Promise<any>;
    getNetworkedUTXOs(address: string): Promise<Array<UTXO>>;
    getTransactionInfo(txHash: string): Promise<{
        block_height: number;
    }>;
    broadcastTransaction(transaction: string): Promise<string>;
}
export declare const network: {
    BlockstackNetwork: typeof BlockstackNetwork;
    LocalRegtest: typeof LocalRegtest;
    BlockchainInfoApi: typeof BlockchainInfoApi;
    BitcoindAPI: typeof BitcoindAPI;
    InsightClient: typeof InsightClient;
    defaults: {
        LOCAL_REGTEST: LocalRegtest;
        MAINNET_DEFAULT: BlockstackNetwork;
    };
};
