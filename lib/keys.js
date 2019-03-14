"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
var bitcoinjs_lib_1 = require("bitcoinjs-lib");
function getEntropy(numberOfBytes) {
    if (!numberOfBytes) {
        numberOfBytes = 32;
    }
    return crypto_1.randomBytes(numberOfBytes);
}
exports.getEntropy = getEntropy;
/**
* @ignore
*/
function makeECPrivateKey() {
    var keyPair = bitcoinjs_lib_1.ECPair.makeRandom({ rng: getEntropy });
    return keyPair.privateKey.toString('hex');
}
exports.makeECPrivateKey = makeECPrivateKey;
/**
* @ignore
*/
function publicKeyToAddress(publicKey) {
    var publicKeyBuffer = Buffer.from(publicKey, 'hex');
    var publicKeyHash160 = bitcoinjs_lib_1.crypto.hash160(publicKeyBuffer);
    var address = bitcoinjs_lib_1.address.toBase58Check(publicKeyHash160, 0x00);
    return address;
}
exports.publicKeyToAddress = publicKeyToAddress;
/**
* @ignore
*/
function getPublicKeyFromPrivate(privateKey) {
    var keyPair = bitcoinjs_lib_1.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
    return keyPair.publicKey.toString('hex');
}
exports.getPublicKeyFromPrivate = getPublicKeyFromPrivate;
//# sourceMappingURL=keys.js.map