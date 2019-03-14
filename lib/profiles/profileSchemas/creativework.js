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
// @ts-ignore: Could not find a declaration file for module
var schema_inspector_1 = __importDefault(require("schema-inspector"));
var profileTokens_1 = require("../profileTokens");
var profile_1 = require("../profile");
var schemaDefinition = {
    type: 'object',
    properties: {
        '@context': { type: 'string', optional: true },
        '@type': { type: 'string' },
        '@id': { type: 'string', optional: true }
    }
};
var CreativeWork = /** @class */ (function (_super) {
    __extends(CreativeWork, _super);
    function CreativeWork(profile) {
        if (profile === void 0) { profile = {}; }
        var _this = _super.call(this, profile) || this;
        _this._profile = Object.assign({}, {
            '@type': 'CreativeWork'
        }, _this._profile);
        return _this;
    }
    CreativeWork.validateSchema = function (profile, strict) {
        if (strict === void 0) { strict = false; }
        schemaDefinition.strict = strict;
        return schema_inspector_1.default.validate(schemaDefinition, profile);
    };
    CreativeWork.fromToken = function (token, publicKeyOrAddress) {
        if (publicKeyOrAddress === void 0) { publicKeyOrAddress = null; }
        var profile = profileTokens_1.extractProfile(token, publicKeyOrAddress);
        return new CreativeWork(profile);
    };
    return CreativeWork;
}(profile_1.Profile));
exports.CreativeWork = CreativeWork;
//# sourceMappingURL=creativework.js.map