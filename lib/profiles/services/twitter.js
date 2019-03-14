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
var Twitter = /** @class */ (function (_super) {
    __extends(Twitter, _super);
    function Twitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Twitter.getBaseUrls = function () {
        var baseUrls = [
            'https://twitter.com/',
            'http://twitter.com/',
            'twitter.com/'
        ];
        return baseUrls;
    };
    Twitter.normalizeUrl = function (proof) {
        return '';
    };
    Twitter.getProofStatement = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var statement = $('meta[property="og:description"]').attr('content');
        if (statement !== undefined) {
            return statement.trim().replace('“', '').replace('”', '');
        }
        else {
            return '';
        }
    };
    return Twitter;
}(service_1.Service));
exports.Twitter = Twitter;
//# sourceMappingURL=twitter.js.map