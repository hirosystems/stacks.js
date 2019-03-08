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
var LinkedIn = /** @class */ (function (_super) {
    __extends(LinkedIn, _super);
    function LinkedIn() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LinkedIn.getBaseUrls = function () {
        var baseUrls = [
            'https://www.linkedin.com/feed/update/',
            'http://www.linkedin.com/feed/update/',
            'www.linkedin.com/feed/update/'
        ];
        return baseUrls;
    };
    LinkedIn.getProofUrl = function (proof) {
        var baseUrls = this.getBaseUrls();
        var proofUrl = proof.proof_url.toLowerCase();
        proofUrl = _super.prefixScheme.call(this, proofUrl);
        for (var i = 0; i < baseUrls.length; i++) {
            if (proofUrl.startsWith("" + baseUrls[i])) {
                return proofUrl;
            }
        }
        throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
    };
    LinkedIn.normalizeUrl = function (proof) {
        return '';
    };
    LinkedIn.shouldValidateIdentityInBody = function () {
        return true;
    };
    LinkedIn.getProofIdentity = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var profileLink = $('article').find('.post-meta__profile-link');
        if (profileLink !== undefined) {
            if (profileLink.attr('href') === undefined) {
                return '';
            }
            return profileLink.attr('href').split('/').pop();
        }
        else {
            return '';
        }
    };
    LinkedIn.getProofStatement = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var postContent = $('article').find('.commentary');
        var statement = '';
        if (postContent !== undefined) {
            statement = postContent.text();
        }
        return statement;
    };
    return LinkedIn;
}(service_1.Service));
exports.LinkedIn = LinkedIn;
//# sourceMappingURL=linkedIn.js.map