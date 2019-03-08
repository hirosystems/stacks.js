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
var Facebook = /** @class */ (function (_super) {
    __extends(Facebook, _super);
    function Facebook() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Facebook.getProofUrl = function (proof) {
        return this.normalizeUrl(proof);
    };
    Facebook.normalizeUrl = function (proof) {
        var proofUrl = proof.proof_url.toLowerCase();
        var urlRegex = /(?:http[s]*:\/\/){0,1}(?:[a-zA-Z0-9-]+\.)+facebook\.com/;
        proofUrl = _super.prefixScheme.call(this, proofUrl);
        if (proofUrl.startsWith('https://facebook.com')) {
            var tokens = proofUrl.split('https://facebook.com');
            proofUrl = "https://www.facebook.com" + tokens[1];
            tokens = proofUrl.split('https://www.facebook.com/')[1].split('/posts/');
            var postId = tokens[1];
            proofUrl = "https://www.facebook.com/" + proof.identifier + "/posts/" + postId;
        }
        else if (proofUrl.match(urlRegex)) {
            var tokens = proofUrl.split('facebook.com/')[1].split('/posts/');
            var postId = tokens[1];
            proofUrl = "https://www.facebook.com/" + proof.identifier + "/posts/" + postId;
        }
        else {
            throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
        }
        return proofUrl;
    };
    Facebook.getProofStatement = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var statement = $('meta[name="description"]').attr('content');
        return (statement !== undefined) ? statement.trim() : '';
    };
    return Facebook;
}(service_1.Service));
exports.Facebook = Facebook;
//# sourceMappingURL=facebook.js.map