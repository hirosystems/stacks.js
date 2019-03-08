"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = __importStar(require("crypto"));
var bitcoinjs_lib_1 = __importStar(require("bitcoinjs-lib"));
var bip39_1 = __importDefault(require("bip39"));
var bip32_1 = __importDefault(require("bip32"));
var utils_1 = require("./utils");
var wallet_1 = require("./encryption/wallet");
var APPS_NODE_INDEX = 0;
var IDENTITY_KEYCHAIN = 888;
var BLOCKSTACK_ON_BITCOIN = 0;
var BITCOIN_BIP_44_PURPOSE = 44;
var BITCOIN_COIN_TYPE = 0;
var BITCOIN_ACCOUNT_INDEX = 0;
var EXTERNAL_ADDRESS = 'EXTERNAL_ADDRESS';
var CHANGE_ADDRESS = 'CHANGE_ADDRESS';
function hashCode(string) {
    var hash = 0;
    if (string.length === 0)
        return hash;
    for (var i = 0; i < string.length; i++) {
        var character = string.charCodeAt(i);
        hash = (hash << 5) - hash + character;
        hash &= hash;
    }
    return hash & 0x7fffffff;
}
function getNodePrivateKey(node) {
    return utils_1.ecPairToHexString(bitcoinjs_lib_1.ECPair.fromPrivateKey(node.privateKey));
}
function getNodePublicKey(node) {
    return node.publicKey.toString('hex');
}
/**
 * The BlockstackWallet class manages the hierarchical derivation
 *  paths for a standard blockstack client wallet. This includes paths
 *  for bitcoin payment address, blockstack identity addresses, blockstack
 *  application specific addresses.
 *  @private
 */
var BlockstackWallet = /** @class */ (function () {
    function BlockstackWallet(rootNode) {
        this.rootNode = rootNode;
    }
    BlockstackWallet.prototype.toBase58 = function () {
        return this.rootNode.toBase58();
    };
    /**
     * Initialize a blockstack wallet from a seed buffer
     * @param {Buffer} seed - the input seed for initializing the root node
     *  of the hierarchical wallet
     * @return {BlockstackWallet} the constructed wallet
     */
    BlockstackWallet.fromSeedBuffer = function (seed) {
        return new BlockstackWallet(bip32_1.default.fromSeed(seed));
    };
    /**
     * Initialize a blockstack wallet from a base58 string
     * @param {string} keychain - the Base58 string used to initialize
     *  the root node of the hierarchical wallet
     * @return {BlockstackWallet} the constructed wallet
     */
    BlockstackWallet.fromBase58 = function (keychain) {
        return new BlockstackWallet(bip32_1.default.fromBase58(keychain));
    };
    /**
     * Initialize a blockstack wallet from an encrypted phrase & password. Throws
     * if the password is incorrect. Supports all formats of Blockstack phrases.
     * @param {string} data - The encrypted phrase as a hex-encoded string
     * @param {string} password - The plain password
     * @return {Promise<BlockstackWallet>} the constructed wallet
     */
    BlockstackWallet.fromEncryptedMnemonic = function (data, password) {
        return wallet_1.decryptMnemonic(data, password)
            .then(function (mnemonic) {
            var seed = bip39_1.default.mnemonicToSeed(mnemonic);
            return new BlockstackWallet(bip32_1.default.fromSeed(seed));
        })
            .catch(function (err) {
            if (err.message && err.message.startsWith('bad header;')) {
                throw new Error('Incorrect password');
            }
            else {
                throw err;
            }
        });
    };
    /**
     * Generate a BIP-39 12 word mnemonic
     * @return {Promise<string>} space-separated 12 word phrase
     */
    BlockstackWallet.generateMnemonic = function () {
        return bip39_1.default.generateMnemonic(128, crypto_1.randomBytes);
    };
    /**
     * Encrypt a mnemonic phrase with a password
     * @param {string} mnemonic - Raw mnemonic phrase
     * @param {string} password - Password to encrypt mnemonic with
     * @return {Promise<string>} Hex-encoded encrypted mnemonic
     */
    BlockstackWallet.encryptMnemonic = function (mnemonic, password) {
        return __awaiter(this, void 0, void 0, function () {
            var encryptedBuffer;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wallet_1.encryptMnemonic(mnemonic, password)];
                    case 1:
                        encryptedBuffer = _a.sent();
                        return [2 /*return*/, encryptedBuffer.toString('hex')];
                }
            });
        });
    };
    BlockstackWallet.prototype.getIdentityPrivateKeychain = function () {
        return this.rootNode
            .deriveHardened(IDENTITY_KEYCHAIN)
            .deriveHardened(BLOCKSTACK_ON_BITCOIN);
    };
    BlockstackWallet.prototype.getBitcoinPrivateKeychain = function () {
        return this.rootNode
            .deriveHardened(BITCOIN_BIP_44_PURPOSE)
            .deriveHardened(BITCOIN_COIN_TYPE)
            .deriveHardened(BITCOIN_ACCOUNT_INDEX);
    };
    BlockstackWallet.prototype.getBitcoinNode = function (addressIndex, chainType) {
        if (chainType === void 0) { chainType = EXTERNAL_ADDRESS; }
        return BlockstackWallet.getNodeFromBitcoinKeychain(this.getBitcoinPrivateKeychain().toBase58(), addressIndex, chainType);
    };
    BlockstackWallet.prototype.getIdentityAddressNode = function (identityIndex) {
        var identityPrivateKeychain = this.getIdentityPrivateKeychain();
        return identityPrivateKeychain.deriveHardened(identityIndex);
    };
    BlockstackWallet.getAppsNode = function (identityNode) {
        return identityNode.deriveHardened(APPS_NODE_INDEX);
    };
    /**
     * Get a salt for use with creating application specific addresses
     * @return {String} the salt
     */
    BlockstackWallet.prototype.getIdentitySalt = function () {
        var identityPrivateKeychain = this.getIdentityPrivateKeychain();
        var publicKeyHex = getNodePublicKey(identityPrivateKeychain);
        return crypto_1.default.createHash('sha256').update(publicKeyHex).digest('hex');
    };
    /**
     * Get a bitcoin receive address at a given index
     * @param {number} addressIndex - the index of the address
     * @return {String} address
     */
    BlockstackWallet.prototype.getBitcoinAddress = function (addressIndex) {
        return BlockstackWallet.getAddressFromBIP32Node(this.getBitcoinNode(addressIndex));
    };
    /**
     * Get the private key hex-string for a given bitcoin receive address
     * @param {number} addressIndex - the index of the address
     * @return {String} the hex-string. this will be either 64
     * characters long to denote an uncompressed bitcoin address, or 66
     * characters long for a compressed bitcoin address.
     */
    BlockstackWallet.prototype.getBitcoinPrivateKey = function (addressIndex) {
        return getNodePrivateKey(this.getBitcoinNode(addressIndex));
    };
    /**
     * Get the root node for the bitcoin public keychain
     * @return {String} base58-encoding of the public node
     */
    BlockstackWallet.prototype.getBitcoinPublicKeychain = function () {
        return this.getBitcoinPrivateKeychain().neutered();
    };
    /**
     * Get the root node for the identity public keychain
     * @return {String} base58-encoding of the public node
     */
    BlockstackWallet.prototype.getIdentityPublicKeychain = function () {
        return this.getIdentityPrivateKeychain().neutered();
    };
    BlockstackWallet.getNodeFromBitcoinKeychain = function (keychainBase58, addressIndex, chainType) {
        if (chainType === void 0) { chainType = EXTERNAL_ADDRESS; }
        var chain;
        if (chainType === EXTERNAL_ADDRESS) {
            chain = 0;
        }
        else if (chainType === CHANGE_ADDRESS) {
            chain = 1;
        }
        else {
            throw new Error('Invalid chain type');
        }
        var keychain = bip32_1.default.fromBase58(keychainBase58);
        return keychain.derive(chain).derive(addressIndex);
    };
    /**
     * Get a bitcoin address given a base-58 encoded bitcoin node
     * (usually called the account node)
     * @param {String} keychainBase58 - base58-encoding of the node
     * @param {number} addressIndex - index of the address to get
     * @param {String} chainType - either 'EXTERNAL_ADDRESS' (for a
     * "receive" address) or 'CHANGE_ADDRESS'
     * @return {String} the address
     */
    BlockstackWallet.getAddressFromBitcoinKeychain = function (keychainBase58, addressIndex, chainType) {
        if (chainType === void 0) { chainType = EXTERNAL_ADDRESS; }
        return BlockstackWallet.getAddressFromBIP32Node(BlockstackWallet
            .getNodeFromBitcoinKeychain(keychainBase58, addressIndex, chainType));
    };
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
    BlockstackWallet.getLegacyAppPrivateKey = function (appsNodeKey, salt, appDomain) {
        var hash = crypto_1.default
            .createHash('sha256')
            .update("" + appDomain + salt)
            .digest('hex');
        var appIndex = hashCode(hash);
        var appNode = bip32_1.default.fromBase58(appsNodeKey).deriveHardened(appIndex);
        return getNodePrivateKey(appNode).slice(0, 64);
    };
    BlockstackWallet.getAddressFromBIP32Node = function (node) {
        return bitcoinjs_lib_1.default.payments.p2pkh({ pubkey: node.publicKey }).address;
    };
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
    BlockstackWallet.getAppPrivateKey = function (appsNodeKey, salt, appDomain) {
        var hash = crypto_1.default
            .createHash('sha256')
            .update("" + appDomain + salt)
            .digest('hex');
        var appIndexHexes = [];
        // note: there's hardcoded numbers here, precisely because I want this
        //   code to be very specific to the derivation paths we expect.
        if (hash.length !== 64) {
            throw new Error("Unexpected app-domain hash length of " + hash.length);
        }
        for (var i = 0; i < 11; i++) { // split the hash into 3-byte chunks
            // because child nodes can only be up to 2^31,
            // and we shouldn't deal in partial bytes.
            appIndexHexes.push(hash.slice(i * 6, i * 6 + 6));
        }
        var appNode = bip32_1.default.fromBase58(appsNodeKey);
        appIndexHexes.forEach(function (hex) {
            if (hex.length > 6) {
                throw new Error('Invalid hex string length');
            }
            appNode = appNode.deriveHardened(parseInt(hex, 16));
        });
        return getNodePrivateKey(appNode).slice(0, 64);
    };
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
    BlockstackWallet.prototype.getIdentityKeyPair = function (addressIndex, alwaysUncompressed) {
        if (alwaysUncompressed === void 0) { alwaysUncompressed = false; }
        var identityNode = this.getIdentityAddressNode(addressIndex);
        var address = BlockstackWallet.getAddressFromBIP32Node(identityNode);
        var identityKey = getNodePrivateKey(identityNode);
        if (alwaysUncompressed && identityKey.length === 66) {
            identityKey = identityKey.slice(0, 64);
        }
        var identityKeyID = getNodePublicKey(identityNode);
        var appsNodeKey = BlockstackWallet.getAppsNode(identityNode).toBase58();
        var salt = this.getIdentitySalt();
        var keyPair = {
            key: identityKey,
            keyID: identityKeyID,
            address: address,
            appsNodeKey: appsNodeKey,
            salt: salt
        };
        return keyPair;
    };
    return BlockstackWallet;
}());
exports.BlockstackWallet = BlockstackWallet;
//# sourceMappingURL=wallet.js.map