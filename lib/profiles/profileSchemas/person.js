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
var profile_1 = require("../profile");
var profileTokens_1 = require("../profileTokens");
var personLegacy_1 = require("./personLegacy");
var personUtils_1 = require("./personUtils");
var schemaDefinition = {
    type: 'object',
    strict: false,
    properties: {
        '@context': { type: 'string', optional: true },
        '@type': { type: 'string' },
        '@id': { type: 'string', optional: true },
        name: { type: 'string', optional: true },
        givenName: { type: 'string', optional: true },
        familyName: { type: 'string', optional: true },
        description: { type: 'string', optional: true },
        image: {
            type: 'array',
            optional: true,
            items: {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    name: { type: 'string', optional: true },
                    contentUrl: { type: 'string', optional: true }
                }
            }
        },
        website: {
            type: 'array',
            optional: true,
            items: {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    url: { type: 'string', optional: true }
                }
            }
        },
        account: {
            type: 'array',
            optional: true,
            items: {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    service: { type: 'string', optional: true },
                    identifier: { type: 'string', optional: true },
                    proofType: { type: 'string', optional: true },
                    proofUrl: { type: 'string', optional: true },
                    proofMessage: { type: 'string', optional: true },
                    proofSignature: { type: 'string', optional: true }
                }
            }
        },
        worksFor: {
            type: 'array',
            optional: true,
            items: {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    '@id': { type: 'string', optional: true }
                }
            }
        },
        knows: {
            type: 'array',
            optional: true,
            items: {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    '@id': { type: 'string', optional: true }
                }
            }
        },
        address: {
            type: 'object',
            optional: true,
            properties: {
                '@type': { type: 'string' },
                streetAddress: { type: 'string', optional: true },
                addressLocality: { type: 'string', optional: true },
                postalCode: { type: 'string', optional: true },
                addressCountry: { type: 'string', optional: true }
            }
        },
        birthDate: { type: 'string', optional: true },
        taxID: { type: 'string', optional: true }
    }
};
var Person = /** @class */ (function (_super) {
    __extends(Person, _super);
    function Person(profile) {
        if (profile === void 0) { profile = {}; }
        var _this = _super.call(this, profile) || this;
        _this._profile = Object.assign({}, {
            '@type': 'Person'
        }, _this._profile);
        return _this;
    }
    Person.validateSchema = function (profile, strict) {
        if (strict === void 0) { strict = false; }
        schemaDefinition.strict = strict;
        return schema_inspector_1.default.validate(schemaDefinition, profile);
    };
    Person.fromToken = function (token, publicKeyOrAddress) {
        if (publicKeyOrAddress === void 0) { publicKeyOrAddress = null; }
        var profile = profileTokens_1.extractProfile(token, publicKeyOrAddress);
        return new Person(profile);
    };
    Person.fromLegacyFormat = function (legacyProfile) {
        var profile = personLegacy_1.getPersonFromLegacyFormat(legacyProfile);
        return new Person(profile);
    };
    Person.prototype.toJSON = function () {
        return {
            profile: this.profile(),
            name: this.name(),
            givenName: this.givenName(),
            familyName: this.familyName(),
            description: this.description(),
            avatarUrl: this.avatarUrl(),
            verifiedAccounts: this.verifiedAccounts(),
            address: this.address(),
            birthDate: this.birthDate(),
            connections: this.connections(),
            organizations: this.organizations()
        };
    };
    Person.prototype.profile = function () {
        return Object.assign({}, this._profile);
    };
    Person.prototype.name = function () {
        return personUtils_1.getName(this.profile());
    };
    Person.prototype.givenName = function () {
        return personUtils_1.getGivenName(this.profile());
    };
    Person.prototype.familyName = function () {
        return personUtils_1.getFamilyName(this.profile());
    };
    Person.prototype.description = function () {
        return personUtils_1.getDescription(this.profile());
    };
    Person.prototype.avatarUrl = function () {
        return personUtils_1.getAvatarUrl(this.profile());
    };
    Person.prototype.verifiedAccounts = function (verifications) {
        return personUtils_1.getVerifiedAccounts(this.profile(), verifications);
    };
    Person.prototype.address = function () {
        return personUtils_1.getAddress(this.profile());
    };
    Person.prototype.birthDate = function () {
        return personUtils_1.getBirthDate(this.profile());
    };
    Person.prototype.connections = function () {
        return personUtils_1.getConnections(this.profile());
    };
    Person.prototype.organizations = function () {
        return personUtils_1.getOrganizations(this.profile());
    };
    return Person;
}(profile_1.Profile));
exports.Person = Person;
//# sourceMappingURL=person.js.map