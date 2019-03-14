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
Object.defineProperty(exports, "__esModule", { value: true });
var service_1 = require("./service");
var Github = /** @class */ (function (_super) {
    __extends(Github, _super);
    function Github() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Github.getBaseUrls = function () {
        var baseUrls = ['https://gist.github.com/', 'http://gist.github.com', 'gist.github.com'];
        return baseUrls;
    };
    Github.normalizeUrl = function (proof) {
        return '';
    };
    Github.getProofUrl = function (proof) {
        var baseUrls = this.getBaseUrls();
        var proofUrl = proof.proof_url.toLowerCase();
        proofUrl = _super.prefixScheme.call(this, proofUrl);
        for (var i = 0; i < baseUrls.length; i++) {
            var requiredPrefix = ("" + baseUrls[i] + proof.identifier).toLowerCase();
            if (proofUrl.startsWith(requiredPrefix)) {
                var raw = proofUrl.endsWith('/') ? 'raw' : '/raw';
                return "" + proofUrl + raw;
            }
        }
        throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
    };
    return Github;
}(service_1.Service));
exports.Github = Github;
//# sourceMappingURL=github.js.map