"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors_1 = require("../errors");
var SESSION_VERSION = '1.0.0';
var SessionData = /** @class */ (function () {
    function SessionData(options) {
        this.version = SESSION_VERSION;
        this.appPrivateKey = options.appPrivateKey;
        this.identityAddress = options.identityAddress;
        this.username = options.username;
        this.coreNode = options.coreNode;
        this.hubUrl = options.hubUrl;
        this.userData = options.userData;
        this.transitKey = options.transitKey;
    }
    SessionData.prototype.getGaiaHubConfig = function () {
        return this.userData && this.userData.gaiaHubConfig;
    };
    SessionData.prototype.setGaiaHubConfig = function (config) {
        this.userData.gaiaHubConfig = config;
    };
    SessionData.fromJSON = function (json) {
        if (json.version !== SESSION_VERSION) {
            throw new errors_1.InvalidStateError("JSON data version " + json.version + " not supported by SessionData");
        }
        var options = {
            appPrivateKey: json.appPrivateKey,
            identityAddress: json.identityAddress,
            username: json.username,
            coreNode: json.coreNode,
            hubUrl: json.hubUrl,
            userData: json.userData,
            transitKey: json.transitKey
        };
        return new SessionData(options);
    };
    SessionData.prototype.toString = function () {
        return JSON.stringify(this);
    };
    return SessionData;
}());
exports.SessionData = SessionData;
//# sourceMappingURL=sessionData.js.map