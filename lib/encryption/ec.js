"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var elliptic_1 = require("elliptic");
var crypto_1 = __importDefault(require("crypto"));
var keys_1 = require("../keys");
var ecurve = new elliptic_1.ec('secp256k1');
/**
* @ignore
*/
function aes256CbcEncrypt(iv, key, plaintext) {
    var cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}
/**
* @ignore
*/
function aes256CbcDecrypt(iv, key, ciphertext) {
    var cipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([cipher.update(ciphertext), cipher.final()]);
}
/**
* @ignore
*/
function hmacSha256(key, content) {
    return crypto_1.default.createHmac('sha256', key).update(content).digest();
}
/**
* @ignore
*/
function equalConstTime(b1, b2) {
    if (b1.length !== b2.length) {
        return false;
    }
    var res = 0;
    for (var i = 0; i < b1.length; i++) {
        res |= b1[i] ^ b2[i]; // jshint ignore:line
    }
    return res === 0;
}
/**
* @ignore
*/
function sharedSecretToKeys(sharedSecret) {
    // generate mac and encryption key from shared secret
    var hashedSecret = crypto_1.default.createHash('sha512').update(sharedSecret).digest();
    return {
        encryptionKey: hashedSecret.slice(0, 32),
        hmacKey: hashedSecret.slice(32)
    };
}
/**
* @ignore
*/
function getHexFromBN(bnInput) {
    var hexOut = bnInput.toString('hex');
    if (hexOut.length === 64) {
        return hexOut;
    }
    else if (hexOut.length < 64) {
        // pad with leading zeros
        // the padStart function would require node 9
        var padding = '0'.repeat(64 - hexOut.length);
        return "" + padding + hexOut;
    }
    else {
        throw new Error('Generated a > 32-byte BN for encryption. Failing.');
    }
}
exports.getHexFromBN = getHexFromBN;
/**
 * Encrypt content to elliptic curve publicKey using ECIES
 * @param {String} publicKey - secp256k1 public key hex string
 * @param {String | Buffer} content - content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 *
 * @private
 * @ignore
 */
function encryptECIES(publicKey, content) {
    var isString = (typeof (content) === 'string');
    // always copy to buffer
    var plainText = content instanceof Buffer ? Buffer.from(content) : Buffer.from(content);
    var ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic();
    var ephemeralSK = ecurve.genKeyPair();
    var ephemeralPK = ephemeralSK.getPublic();
    var sharedSecret = ephemeralSK.derive(ecPK);
    var sharedSecretHex = getHexFromBN(sharedSecret);
    var sharedKeys = sharedSecretToKeys(Buffer.from(sharedSecretHex, 'hex'));
    var initializationVector = crypto_1.default.randomBytes(16);
    var cipherText = aes256CbcEncrypt(initializationVector, sharedKeys.encryptionKey, plainText);
    var macData = Buffer.concat([initializationVector,
        Buffer.from(ephemeralPK.encodeCompressed()),
        cipherText]);
    var mac = hmacSha256(sharedKeys.hmacKey, macData);
    return {
        iv: initializationVector.toString('hex'),
        ephemeralPK: ephemeralPK.encodeCompressed('hex'),
        cipherText: cipherText.toString('hex'),
        mac: mac.toString('hex'),
        wasString: isString
    };
}
exports.encryptECIES = encryptECIES;
/**
 * Decrypt content encrypted using ECIES
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} cipherObject - object to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * @return {Buffer} plaintext
 * @throws {Error} if unable to decrypt
 * @private
 * @ignore
 */
function decryptECIES(privateKey, cipherObject) {
    var ecSK = ecurve.keyFromPrivate(privateKey, 'hex');
    var ephemeralPK = ecurve.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic();
    var sharedSecret = ecSK.derive(ephemeralPK);
    var sharedSecretBuffer = Buffer.from(getHexFromBN(sharedSecret), 'hex');
    var sharedKeys = sharedSecretToKeys(sharedSecretBuffer);
    var ivBuffer = Buffer.from(cipherObject.iv, 'hex');
    var cipherTextBuffer = Buffer.from(cipherObject.cipherText, 'hex');
    var macData = Buffer.concat([ivBuffer,
        Buffer.from(ephemeralPK.encodeCompressed()),
        cipherTextBuffer]);
    var actualMac = hmacSha256(sharedKeys.hmacKey, macData);
    var expectedMac = Buffer.from(cipherObject.mac, 'hex');
    if (!equalConstTime(expectedMac, actualMac)) {
        throw new Error('Decryption failed: failure in MAC check');
    }
    var plainText = aes256CbcDecrypt(ivBuffer, sharedKeys.encryptionKey, cipherTextBuffer);
    if (cipherObject.wasString) {
        return plainText.toString();
    }
    else {
        return plainText;
    }
}
exports.decryptECIES = decryptECIES;
/**
 * Sign content using ECDSA
 *
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 * @private
 * @ignore
 */
function signECDSA(privateKey, content) {
    var contentBuffer = content instanceof Buffer ? content : Buffer.from(content);
    var ecPrivate = ecurve.keyFromPrivate(privateKey, 'hex');
    var publicKey = keys_1.getPublicKeyFromPrivate(privateKey);
    var contentHash = crypto_1.default.createHash('sha256').update(contentBuffer).digest();
    var signature = ecPrivate.sign(contentHash);
    var signatureString = signature.toDER('hex');
    return {
        signature: signatureString,
        publicKey: publicKey
    };
}
exports.signECDSA = signECDSA;
/**
* @ignore
*/
function getBuffer(content) {
    if (content instanceof Buffer)
        return content;
    else if (content instanceof ArrayBuffer)
        return Buffer.from(content);
    else
        return Buffer.from(content);
}
/**
 * Verify content using ECDSA
 * @param {String | Buffer} content - Content to verify was signed
 * @param {String} publicKey - secp256k1 private key hex string
 * @param {String} signature - Hex encoded DER signature
 * @return {Boolean} returns true when signature matches publickey + content, false if not
 * @private
 * @ignore
 */
function verifyECDSA(content, publicKey, signature) {
    var contentBuffer = getBuffer(content);
    var ecPublic = ecurve.keyFromPublic(publicKey, 'hex');
    var contentHash = crypto_1.default.createHash('sha256').update(contentBuffer).digest();
    return ecPublic.verify(contentHash, signature);
}
exports.verifyECDSA = verifyECDSA;
//# sourceMappingURL=ec.js.map