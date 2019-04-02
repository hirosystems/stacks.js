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
var HackerNews = /** @class */ (function (_super) {
    __extends(HackerNews, _super);
    function HackerNews() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HackerNews.getBaseUrls = function () {
        var baseUrls = [
            'https://news.ycombinator.com/user?id=',
            'http://news.ycombinator.com/user?id=',
            'news.ycombinator.com/user?id='
        ];
        return baseUrls;
    };
    HackerNews.getProofUrl = function (proof) {
        var baseUrls = this.getBaseUrls();
        var proofUrl = _super.prefixScheme.call(this, proof.proof_url);
        for (var i = 0; i < baseUrls.length; i++) {
            if (proofUrl === "" + baseUrls[i] + proof.identifier) {
                return proofUrl;
            }
        }
        throw new Error("Proof url " + proof.proof_url + " is not valid for service " + proof.service);
    };
    HackerNews.normalizeUrl = function (proof) {
        return '';
    };
    HackerNews.getProofStatement = function (searchText) {
        var $ = cheerio_1.default.load(searchText);
        var tables = $('#hnmain').children().find('table');
        var statement = '';
        if (tables.length > 0) {
            tables.each(function (tableIndex, table) {
                var rows = $(table).find('tr');
                if (rows.length > 0) {
                    rows.each(function (idx, row) {
                        var heading = $(row).find('td')
                            .first()
                            .text()
                            .trim();
                        if (heading === 'about:') {
                            statement = $(row).find('td')
                                .last()
                                .text()
                                .trim();
                        }
                    });
                }
            });
        }
        return statement;
    };
    return HackerNews;
}(service_1.Service));
exports.HackerNews = HackerNews;
//# sourceMappingURL=hackerNews.js.map