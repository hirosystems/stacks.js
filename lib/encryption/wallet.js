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
var crypto_1 = __importDefault(require("crypto"));
var bip39_1 = __importDefault(require("bip39"));
var triplesec_1 = __importDefault(require("triplesec"));
/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 * @private
 * @ignore
 * */
function encryptMnemonic(phrase, password) {
    return Promise.resolve().then(function () {
        // must be bip39 mnemonic
        if (!bip39_1.default.validateMnemonic(phrase)) {
            throw new Error('Not a valid bip39 nmemonic');
        }
        // normalize plaintext to fixed length byte string
        var plaintextNormalized = Buffer.from(bip39_1.default.mnemonicToEntropy(phrase), 'hex');
        // AES-128-CBC with SHA256 HMAC
        var salt = crypto_1.default.randomBytes(16);
        var keysAndIV = crypto_1.default.pbkdf2Sync(password, salt, 100000, 48, 'sha512');
        var encKey = keysAndIV.slice(0, 16);
        var macKey = keysAndIV.slice(16, 32);
        var iv = keysAndIV.slice(32, 48);
        var cipher = crypto_1.default.createCipheriv('aes-128-cbc', encKey, iv);
        var cipherText = cipher.update(plaintextNormalized).toString('hex');
        cipherText += cipher.final().toString('hex');
        var hmacPayload = Buffer.concat([salt, Buffer.from(cipherText, 'hex')]);
        var hmac = crypto_1.default.createHmac('sha256', macKey);
        hmac.write(hmacPayload);
        var hmacDigest = hmac.digest();
        var payload = Buffer.concat([salt, hmacDigest, Buffer.from(cipherText, 'hex')]);
        return payload;
    });
}
exports.encryptMnemonic = encryptMnemonic;
// Used to distinguish bad password during decrypt vs invalid format
var PasswordError = /** @class */ (function (_super) {
    __extends(PasswordError, _super);
    function PasswordError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PasswordError;
}(Error));
/**
* @ignore
*/
function decryptMnemonicBuffer(dataBuffer, password) {
    return Promise.resolve().then(function () {
        var salt = dataBuffer.slice(0, 16);
        var hmacSig = dataBuffer.slice(16, 48); // 32 bytes
        var cipherText = dataBuffer.slice(48);
        var hmacPayload = Buffer.concat([salt, cipherText]);
        var keysAndIV = crypto_1.default.pbkdf2Sync(password, salt, 100000, 48, 'sha512');
        var encKey = keysAndIV.slice(0, 16);
        var macKey = keysAndIV.slice(16, 32);
        var iv = keysAndIV.slice(32, 48);
        var decipher = crypto_1.default.createDecipheriv('aes-128-cbc', encKey, iv);
        var plaintext = decipher.update(cipherText).toString('hex');
        plaintext += decipher.final().toString('hex');
        var hmac = crypto_1.default.createHmac('sha256', macKey);
        hmac.write(hmacPayload);
        var hmacDigest = hmac.digest();
        // hash both hmacSig and hmacDigest so string comparison time
        // is uncorrelated to the ciphertext
        var hmacSigHash = crypto_1.default.createHash('sha256')
            .update(hmacSig)
            .digest()
            .toString('hex');
        var hmacDigestHash = crypto_1.default.createHash('sha256')
            .update(hmacDigest)
            .digest()
            .toString('hex');
        if (hmacSigHash !== hmacDigestHash) {
            // not authentic
            throw new PasswordError('Wrong password (HMAC mismatch)');
        }
        var mnemonic = bip39_1.default.entropyToMnemonic(plaintext);
        if (!bip39_1.default.validateMnemonic(mnemonic)) {
            throw new PasswordError('Wrong password (invalid plaintext)');
        }
        return mnemonic;
    });
}
/**
 * Decrypt legacy triplesec keys
 * @param {Buffer} dataBuffer - The encrypted key
 * @param {String} password - Password for data
 * @return {Promise<Buffer>} Decrypted seed
 * @private
 * @ignore
 */
function decryptLegacy(dataBuffer, password) {
    return new Promise(function (resolve, reject) {
        triplesec_1.default.decrypt({
            key: Buffer.from(password),
            data: dataBuffer
        }, function (err, plaintextBuffer) {
            if (!err) {
                resolve(plaintextBuffer);
            }
            else {
                reject(err);
            }
        });
    });
}
/**
 * Encrypt a raw mnemonic phrase with a password
 * @param {string | Buffer} data - Buffer or hex-encoded string of the encrypted mnemonic
 * @param {string} password - Password for data
 * @return {Promise<string>} the raw mnemonic phrase
 * @private
 * @ignore
 */
function decryptMnemonic(data, password) {
    var dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex');
    return decryptMnemonicBuffer(dataBuffer, password).catch(function (err) {
        // If it was a password error, don't even bother with legacy
        if (err instanceof PasswordError) {
            throw err;
        }
        return decryptLegacy(dataBuffer, password).then(function (data) { return data.toString(); });
    });
}
exports.decryptMnemonic = decryptMnemonic;
//# sourceMappingURL=wallet.js.map