/**
 *
 * @ignore
 */
export declare type IdentityKeyPair = {
    key: string;
    keyID: string;
    address: string;
    appsNodeKey: string;
    salt: string;
};
/**
 *  The `BlockstackWallet` class manages the hierarchical derivation
 *  paths for a standard Blockstack client wallet. This includes paths
 *  for Bitcoin payment address, Blockstack identity addresses, Blockstack
 *  application specific addresses.
 *
 *  @private
 *
 *  @ignore
 */
export declare class BlockstackWallet {
    private rootNode;
    private constructor();
    private toBase58;
    /**
     * Initialize a Blockstack wallet from a seed buffer
     * @param {Buffer} seed - the input seed for initializing the root node
     *  of the hierarchical wallet
     * @return {BlockstackWallet} the constructed wallet
     */
    private static fromSeedBuffer;
    /**
     * Initialize a Blockstack wallet from a base58 string
     * @param {string} keychain - the Base58 string used to initialize
     *  the root node of the hierarchical wallet
     * @return {BlockstackWallet} the constructed wallet
     */
    private static fromBase58;
    /**
     * Initialize a blockstack wallet from an encrypted phrase & password. Throws
     * if the password is incorrect. Supports all formats of Blockstack phrases.
     * @param {string} data - The encrypted phrase as a hex-encoded string
     * @param {string} password - The plain password
     * @return {Promise<BlockstackWallet>} the constructed wallet
     *
     * @ignore
     */
    static fromEncryptedMnemonic(data: string, password: string): Promise<BlockstackWallet>;
    /**
     * Generate a BIP-39 12 word mnemonic
     * @return {Promise<string>} space-separated 12 word phrase
     */
    private static generateMnemonic;
    /**
     * Encrypt a mnemonic phrase with a password
     * @param {string} mnemonic - Raw mnemonic phrase
     * @param {string} password - Password to encrypt mnemonic with
     * @return {Promise<string>} Hex-encoded encrypted mnemonic
     *
     */
    private static encryptMnemonic;
    private getIdentityPrivateKeychain;
    private getBitcoinPrivateKeychain;
    private getBitcoinNode;
    private getIdentityAddressNode;
    private static getAppsNode;
    /**
     * Get a salt for use with creating application specific addresses
     * @return {String} the salt
     */
    private getIdentitySalt;
    /**
     * Get a bitcoin receive address at a given index
     * @param {number} addressIndex - the index of the address
     * @return {String} address
     */
    private getBitcoinAddress;
    /**
     * Get the private key hex-string for a given bitcoin receive address
     * @param {number} addressIndex - the index of the address
     * @return {String} the hex-string. this will be either 64
     * characters long to denote an uncompressed bitcoin address, or 66
     * characters long for a compressed bitcoin address.
     */
    private getBitcoinPrivateKey;
    /**
     * Get the root node for the bitcoin public keychain
     * @return {String} base58-encoding of the public node
     */
    private getBitcoinPublicKeychain;
    /**
     * Get the root node for the identity public keychain
     * @return {String} base58-encoding of the public node
     */
    private getIdentityPublicKeychain;
    private static getNodeFromBitcoinKeychain;
    /**
     * Get a bitcoin address given a base-58 encoded bitcoin node
     * (usually called the account node)
     * @param {String} keychainBase58 - base58-encoding of the node
     * @param {number} addressIndex - index of the address to get
     * @param {String} chainType - either 'EXTERNAL_ADDRESS' (for a
     * "receive" address) or 'CHANGE_ADDRESS'
     * @return {String} the address
     */
    private static getAddressFromBitcoinKeychain;
    /**
     * Get a ECDSA private key hex-string for an application-specific
     *  address.
     * @param {String} appsNodeKey - the base58-encoded private key for
     * applications node (the `appsNodeKey` return in getIdentityKeyPair())
     * @param {String} salt - a string, used to salt the
     * application-specific addresses
     * @param {String} appDomain - the appDomain to generate a key for
     * @return {String} the private key hex-string. this will be a 64
     * character string
     */
    private static getLegacyAppPrivateKey;
    private static getAddressFromBIP32Node;
    /**
     * Get a ECDSA private key hex-string for an application-specific
     *  address.
     * @param {String} appsNodeKey - the base58-encoded private key for
     * applications node (the `appsNodeKey` return in getIdentityKeyPair())
     * @param {String} salt - a string, used to salt the
     * application-specific addresses
     * @param {String} appDomain - the appDomain to generate a key for
     * @return {String} the private key hex-string. this will be a 64
     * character string
     */
    private static getAppPrivateKey;
    /**
     * Get the keypair information for a given identity index. This
     * information is used to obtain the private key for an identity address
     * and derive application specific keys for that address.
     * @param {number} addressIndex - the identity index
     * @param {boolean} alwaysUncompressed - if true, always return a
     *   private-key hex string corresponding to the uncompressed address
     * @return {Object} an IdentityKeyPair type object with keys:
     *   .key {String} - the private key hex-string
     *   .keyID {String} - the public key hex-string
     *   .address {String} - the identity address
     *   .appsNodeKey {String} - the base-58 encoding of the applications node
     *   .salt {String} - the salt used for creating app-specific addresses
     */
    private getIdentityKeyPair;
}
