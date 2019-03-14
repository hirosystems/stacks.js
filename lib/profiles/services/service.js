"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("cross-fetch/polyfill");
var serviceUtils_1 = require("./serviceUtils");
var Service = /** @class */ (function () {
    function Service() {
    }
    Service.validateProof = function (proof, ownerAddress, name) {
        var _this = this;
        if (name === void 0) { name = null; }
        var proofUrl;
        return Promise.resolve()
            .then(function () {
            proofUrl = _this.getProofUrl(proof);
            return fetch(proofUrl);
        })
            .then(function (res) {
            if (res.status !== 200) {
                throw new Error("Proof url " + proofUrl + " returned unexpected http status " + res.status + ".\n              Unable to validate proof.");
            }
            return res.text();
        })
            .then(function (text) {
            // Validate identity in provided proof body/tags if required
            if (_this.shouldValidateIdentityInBody()
                && proof.identifier !== _this.getProofIdentity(text)) {
                return proof;
            }
            var proofText = _this.getProofStatement(text);
            proof.valid = serviceUtils_1.containsValidProofStatement(proofText, name)
                || serviceUtils_1.containsValidAddressProofStatement(proofText, ownerAddress);
            return proof;
        })
            .catch(function (error) {
            console.error(error);
            proof.valid = false;
            return proof;
        });
    };
    Service.getBaseUrls = function () {
        return [];
    };
    Service.getProofIdentity = function (searchText) {
        return searchText;
    };
    Service.getProofStatement = function (searchText) {
        return searchText;
    };
    Service.shouldValidateIdentityInBody = function () {
        return false;
    };
    Service.prefixScheme = function (proofUrl) {
        if (!proofUrl.startsWith('https://') && !proofUrl.startsWith('http://')) {
            return "https://" + proofUrl;
        }
        else if (proofUrl.startsWith('http://')) {
            return proofUrl.replace('http://', 'https://');
        }
        else {
            return proofUrl;
        }
    };
    Service.getProofUrl = function (proof) {
        var baseUrls = this.getBaseUrls();
        var proofUrl = proof.proof_url.toLowerCase();
        proofUrl = this.prefixScheme(proofUrl);
        for (var i = 0; i < baseUrls.length; i++) {
            var requiredPrefix = ("" + baseUrls[i] + proof.identifier).toLowerCase();
            if (proofUrl.startsWith(requiredPrefix)) {
                return proofUrl;
            }
        }
        throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
    };
    return Service;
}());
exports.Service = Service;
//# sourceMappingURL=service.js.map