"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../utils");
/**
 * Class representing a transaction signer for pubkeyhash addresses
 * (a.k.a. single-sig addresses)
 * @private
 */
var PubkeyHashSigner = /** @class */ (function () {
    function PubkeyHashSigner(ecPair) {
        this.ecPair = ecPair;
    }
    PubkeyHashSigner.fromHexString = function (keyHex) {
        return new PubkeyHashSigner(utils_1.hexStringToECPair(keyHex));
    };
    PubkeyHashSigner.prototype.signerVersion = function () {
        return 1;
    };
    PubkeyHashSigner.prototype.getAddress = function () {
        var _this = this;
        return Promise.resolve()
            .then(function () { return utils_1.ecPairToAddress(_this.ecPair); });
    };
    PubkeyHashSigner.prototype.signTransaction = function (transaction, inputIndex) {
        var _this = this;
        return Promise.resolve()
            .then(function () {
            transaction.sign(inputIndex, _this.ecPair);
        });
    };
    return PubkeyHashSigner;
}());
exports.PubkeyHashSigner = PubkeyHashSigner;
//# sourceMappingURL=signers.js.map