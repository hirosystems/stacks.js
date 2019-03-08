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
var cheerio_1 = __importDefault(require("cheerio"));
var service_1 = require("./service");
var Instagram = /** @class */ (function (_super) {
    __extends(Instagram, _super);
    function Instagram() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Instagram.getBaseUrls = function () {
        var baseUrls = ['https://www.instagram.com/', 'https://instagram.com/'];
        return baseUrls;
    };
    Instagram.getProofUrl = function (proof) {
        var baseUrls = this.getBaseUrls();
        var normalizedProofUrl = this.normalizeUrl(proof);
        for (var i = 0; i < baseUrls.length; i++) {
            if (normalizedProofUrl.startsWith("" + baseUrls[i])) {
                return normalizedProofUrl;
            }
        }
        throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
    };
    Instagram.normalizeUrl = function (proof) {
        var proofUrl = proof.proof_url;
        proofUrl = _super.prefixScheme.call(this, proofUrl);
        if (proofUrl.startsWith('https://instagram.com')) {
            var tokens = proofUrl.split('https://instagram.com');
            proofUrl = "https://www.instagram.com" + tokens[1];
        }
        return proofUrl;
    };
    Instagram.shouldValidateIdentityInBody = function () {
        return true;
    };
    Instagram.getProofIdentity = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var username = $('meta[property="og:description"]').attr('content');
        if (username !== undefined && username.split(':').length > 1) {
            return username.split(':')[0].match(/(@\w+)/)[0].substr(1);
        }
        else {
            return '';
        }
    };
    Instagram.getProofStatement = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var statement = $('meta[property="og:description"]')
            .attr('content');
        if (statement !== undefined && statement.split(':').length > 1) {
            return statement.split(':')[1].trim().replace('“', '').replace('”', '');
        }
        else {
            return '';
        }
    };
    return Instagram;
}(service_1.Service));
exports.Instagram = Instagram;
//# sourceMappingURL=instagram.js.map