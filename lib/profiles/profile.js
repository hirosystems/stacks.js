"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: Could not find a declaration file for module
var schema_inspector_1 = __importDefault(require("schema-inspector"));
var profileTokens_1 = require("./profileTokens");
var profileProofs_1 = require("./profileProofs");
var profileZoneFiles_1 = require("./profileZoneFiles");
var schemaDefinition = {
    type: 'object',
    properties: {
        '@context': { type: 'string', optional: true },
        '@type': { type: 'string' }
    }
};
var Profile = /** @class */ (function () {
    function Profile(profile) {
        if (profile === void 0) { profile = {}; }
        this._profile = Object.assign({}, {
            '@context': 'http://schema.org/'
        }, profile);
    }
    Profile.prototype.toJSON = function () {
        return Object.assign({}, this._profile);
    };
    Profile.prototype.toToken = function (privateKey) {
        return profileTokens_1.signProfileToken(this.toJSON(), privateKey);
    };
    Profile.validateSchema = function (profile, strict) {
        if (strict === void 0) { strict = false; }
        schemaDefinition.strict = strict;
        return schema_inspector_1.default.validate(schemaDefinition, profile);
    };
    Profile.fromToken = function (token, publicKeyOrAddress) {
        if (publicKeyOrAddress === void 0) { publicKeyOrAddress = null; }
        var profile = profileTokens_1.extractProfile(token, publicKeyOrAddress);
        return new Profile(profile);
    };
    Profile.makeZoneFile = function (domainName, tokenFileURL) {
        return profileZoneFiles_1.makeProfileZoneFile(domainName, tokenFileURL);
    };
    Profile.validateProofs = function (domainName) {
        return profileProofs_1.validateProofs(new Profile().toJSON(), domainName);
    };
    return Profile;
}());
exports.Profile = Profile;
//# sourceMappingURL=profile.js.map