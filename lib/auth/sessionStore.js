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
var sessionData_1 = require("./sessionData");
// import { BLOCKSTACK_GAIA_HUB_LABEL } from '../storage/hub'
var authConstants_1 = require("./authConstants");
var errors_1 = require("../errors");
// import { Logger } from '../logger'
/**
 * An abstract class representing the SessionDataStore interface.
 * @type {SessionData}
 */
var SessionDataStore = /** @class */ (function () {
    function SessionDataStore(sessionOptions) {
        if (sessionOptions) {
            var newSessionData = new sessionData_1.SessionData(sessionOptions);
            this.setSessionData(newSessionData);
        }
    }
    SessionDataStore.prototype.getSessionData = function () {
        throw new Error('Abstract class');
    };
    /* eslint-disable */
    SessionDataStore.prototype.setSessionData = function (session) {
        throw new Error('Abstract class');
    };
    SessionDataStore.prototype.deleteSessionData = function () {
        throw new Error('Abstract class');
    };
    return SessionDataStore;
}());
exports.SessionDataStore = SessionDataStore;
/**
 * Stores session data in the instance of this class.
 * @type {InstanceDataStore}
 */
var InstanceDataStore = /** @class */ (function (_super) {
    __extends(InstanceDataStore, _super);
    function InstanceDataStore(sessionOptions) {
        var _this = _super.call(this, sessionOptions) || this;
        if (!_this.sessionData) {
            _this.setSessionData(new sessionData_1.SessionData({}));
        }
        return _this;
    }
    InstanceDataStore.prototype.getSessionData = function () {
        if (!this.sessionData) {
            throw new errors_1.NoSessionDataError('No session data was found.');
        }
        return this.sessionData;
    };
    InstanceDataStore.prototype.setSessionData = function (session) {
        this.sessionData = session;
        return true;
    };
    InstanceDataStore.prototype.deleteSessionData = function () {
        this.setSessionData(new sessionData_1.SessionData({}));
        return true;
    };
    return InstanceDataStore;
}(SessionDataStore));
exports.InstanceDataStore = InstanceDataStore;
/**
 * Stores session data in browser a localStorage entry.
 * @type {LocalStorageStore}
 */
var LocalStorageStore = /** @class */ (function (_super) {
    __extends(LocalStorageStore, _super);
    function LocalStorageStore(sessionOptions) {
        var _this = _super.call(this, sessionOptions) || this;
        if (sessionOptions
            && sessionOptions.storeOptions
            && sessionOptions.storeOptions.localStorageKey
            && (typeof sessionOptions.storeOptions.localStorageKey === 'string')) {
            _this.key = sessionOptions.storeOptions.localStorageKey;
        }
        else {
            _this.key = authConstants_1.LOCALSTORAGE_SESSION_KEY;
        }
        var data = localStorage.getItem(_this.key);
        if (!data) {
            var sessionData = new sessionData_1.SessionData({});
            _this.setSessionData(sessionData);
        }
        return _this;
    }
    LocalStorageStore.prototype.getSessionData = function () {
        var data = localStorage.getItem(this.key);
        if (!data) {
            throw new errors_1.NoSessionDataError('No session data was found in localStorage');
        }
        var dataJSON = JSON.parse(data);
        return sessionData_1.SessionData.fromJSON(dataJSON);
    };
    LocalStorageStore.prototype.setSessionData = function (session) {
        localStorage.setItem(this.key, session.toString());
        return true;
    };
    LocalStorageStore.prototype.deleteSessionData = function () {
        localStorage.removeItem(this.key);
        this.setSessionData(new sessionData_1.SessionData({}));
        return true;
    };
    return LocalStorageStore;
}(SessionDataStore));
exports.LocalStorageStore = LocalStorageStore;
//# sourceMappingURL=sessionStore.js.map