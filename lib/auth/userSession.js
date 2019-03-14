"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var appConfig_1 = require("./appConfig");
var sessionStore_1 = require("./sessionStore");
var authApp = __importStar(require("./authApp"));
var authMessages = __importStar(require("./authMessages"));
var storage = __importStar(require("../storage"));
var utils_1 = require("../utils");
var errors_1 = require("../errors");
var logger_1 = require("../logger");
var hub_1 = require("../storage/hub");
var authConstants_1 = require("./authConstants");
/**
 *
 * Represents an instance of a signed in user for a particular app.
 *
 * A signed in user has access to two major pieces of information
 * about the user, the user's private key for that app and the location
 * of the user's gaia storage bucket for the app.
 *
 * A user can be signed in either directly through the interactive
 * sign in process or by directly providing the app private key.
 */
var UserSession = /** @class */ (function () {
    function UserSession(options) {
        var runningInBrowser = true;
        if (typeof window === 'undefined') {
            logger_1.Logger.debug('UserSession: not running in browser');
            runningInBrowser = false;
        }
        if (options && options.appConfig) {
            this.appConfig = options.appConfig;
        }
        else if (runningInBrowser) {
            this.appConfig = new appConfig_1.AppConfig();
        }
        else {
            throw new errors_1.MissingParameterError('You need to specify options.appConfig');
        }
        if (options && options.sessionStore) {
            this.store = options.sessionStore;
        }
        else if (runningInBrowser) {
            if (options) {
                this.store = new sessionStore_1.LocalStorageStore(options.sessionOptions);
            }
            else {
                this.store = new sessionStore_1.LocalStorageStore();
            }
        }
        else if (options) {
            this.store = new sessionStore_1.InstanceDataStore(options.sessionOptions);
        }
        else {
            this.store = new sessionStore_1.InstanceDataStore();
        }
    }
    /* AUTHENTICATION */
    /**
     *
     *
     * Generates an authentication request and redirects the user to the Blockstack
     * browser to approve the sign in request.
     *
     * Please note that this requires that the web browser properly handles the
     * `blockstack:` URL protocol handler.
     *
     * Most applications should use this
     * method for sign in unless they require more fine grained control over how the
     * authentication request is generated. If your app falls into this category,
     * use [[generateAndStoreTransitKey]], [[makeAuthRequest]],
     * and [[redirectToSignInWithAuthRequest]] to build your own sign in process.
     *
     * @return {void}
     */
    UserSession.prototype.redirectToSignIn = function (redirectURI, manifestURI, scopes) {
        var transitKey = this.generateAndStoreTransitKey();
        var authRequest = this.makeAuthRequest(transitKey, redirectURI, manifestURI, scopes);
        var authenticatorURL = this.appConfig && this.appConfig.authenticatorURL;
        return authApp.redirectToSignInWithAuthRequest(authRequest, authenticatorURL);
    };
    /**
     * Redirects the user to the Blockstack browser to approve the sign in request
     * given.
     *
     * The user is redirected to the authenticator URL specified in the `AppConfig`
     * if the `blockstack:` protocol handler is not detected.
     * Please note that the protocol handler detection
     * does not work on all browsers.
     * @param  {String} authRequest - the authentication request generated by [[makeAuthRequest]]
     * @return {void}
     */
    UserSession.prototype.redirectToSignInWithAuthRequest = function (authRequest, blockstackIDHost) {
        authRequest = authRequest || this.makeAuthRequest();
        var authenticatorURL = blockstackIDHost
            || (this.appConfig && this.appConfig.authenticatorURL);
        return authApp.redirectToSignInWithAuthRequest(authRequest, authenticatorURL);
    };
    /**
     * Generates an authentication request that can be sent to the Blockstack
     * browser for the user to approve sign in. This authentication request can
     * then be used for sign in by passing it to the [[redirectToSignInWithAuthRequest]]
     * method.
     *
     * *Note*: This method should only be used if you want to use a customized authentication
     * flow. Typically, you'd use [[redirectToSignIn]] which takes care of this
     * under the hood.
     *
     * @param {string} transitKey - hex-encoded transit key
     * @param {Number} expiresAt - the time at which this request is no longer valid
     * @param {Object} extraParams - Any extra parameters you'd like to pass to the authenticator.
     * Use this to pass options that aren't part of the Blockstack auth spec, but might be supported
     * by special authenticators.
     * @return {String} the authentication request
     */
    UserSession.prototype.makeAuthRequest = function (transitKey, redirectURI, manifestURI, scopes, appDomain, expiresAt, extraParams) {
        if (expiresAt === void 0) { expiresAt = utils_1.nextHour().getTime(); }
        if (extraParams === void 0) { extraParams = {}; }
        var appConfig = this.appConfig;
        if (!appConfig) {
            throw new errors_1.InvalidStateError('Missing AppConfig');
        }
        transitKey = transitKey || this.generateAndStoreTransitKey();
        redirectURI = redirectURI || appConfig.redirectURI();
        manifestURI = manifestURI || appConfig.manifestURI();
        scopes = scopes || appConfig.scopes;
        appDomain = appDomain || appConfig.appDomain;
        return authMessages.makeAuthRequest(transitKey, redirectURI, manifestURI, scopes, appDomain, expiresAt, extraParams);
    };
    /**
     * Generates a ECDSA keypair to
     * use as the ephemeral app transit private key
     * and store in the session.
     *
     * @return {String} the hex encoded private key
     *
     */
    UserSession.prototype.generateAndStoreTransitKey = function () {
        var sessionData = this.store.getSessionData();
        var transitKey = authMessages.generateTransitKey();
        sessionData.transitKey = transitKey;
        this.store.setSessionData(sessionData);
        return transitKey;
    };
    /**
     * Retrieve the authentication token from the URL query.
     *
     * @return {String} the authentication token if it exists otherwise `null`
     */
    UserSession.prototype.getAuthResponseToken = function () {
        return authApp.getAuthResponseToken();
    };
    /**
     * Check if there is a authentication request that hasn't been handled.
     *
     * @return {Boolean} `true` if there is a pending sign in, otherwise `false`
     */
    UserSession.prototype.isSignInPending = function () {
        return authApp.isSignInPending();
    };
    /**
     * Check if a user is currently signed in.
     *
     * @return {Boolean} `true` if the user is signed in, `false` if not.
     */
    UserSession.prototype.isUserSignedIn = function () {
        return !!this.store.getSessionData().userData;
    };
    /**
     * Try to process any pending sign in request by returning a `Promise` that resolves
     * to the user data object if the sign in succeeds.
     *
     * @param {String} authResponseToken - the signed authentication response token
     * @return {Promise} that resolves to the user data object if successful and rejects
     * if handling the sign in request fails or there was no pending sign in request.
     */
    UserSession.prototype.handlePendingSignIn = function (authResponseToken) {
        if (authResponseToken === void 0) { authResponseToken = this.getAuthResponseToken(); }
        var transitKey = this.store.getSessionData().transitKey;
        var nameLookupURL = this.store.getSessionData().coreNode;
        return authApp.handlePendingSignIn(nameLookupURL, authResponseToken, transitKey, this);
    };
    /**
     * Retrieves the user data object. The user's profile is stored in the key [[Profile]].
     *
     * @return {Object} User data object.
     */
    UserSession.prototype.loadUserData = function () {
        var userData = this.store.getSessionData().userData;
        if (!userData) {
            throw new errors_1.InvalidStateError('No user data found. Did the user sign in?');
        }
        return userData;
    };
    /**
     * Sign the user out and optionally redirect to given location.
     * @param  redirectURL
     * Location to redirect user to after sign out.
     * Only used in environments with `window` available
     */
    UserSession.prototype.signUserOut = function (redirectURL) {
        authApp.signUserOut(redirectURL, this);
    };
    //
    //
    // /* PROFILES */
    // extractProfile
    // wrapProfileToken
    // signProfileToken
    // verifyProfileToken
    // validateProofs
    // lookupProfile
    /* STORAGE */
    /**
     * Encrypts the data provided with the app public key.
     * @param {String|Buffer} content - data to encrypt
     * @param {Object} [options=null] - options object
     * @param {String} options.publicKey - the hex string of the ECDSA public
     * key to use for encryption. If not provided, will use user's appPrivateKey.
     * @return {String} Stringified ciphertext object
     */
    UserSession.prototype.encryptContent = function (content, options) {
        return storage.encryptContent(content, options, this);
    };
    /**
     * Decrypts data encrypted with `encryptContent` with the
     * transit private key.
     * @param {String|Buffer} content - encrypted content.
     * @param {Object} [options=null] - options object
     * @param {String} options.privateKey - the hex string of the ECDSA private
     * key to use for decryption. If not provided, will use user's appPrivateKey.
     * @return {String|Buffer} decrypted content.
     */
    UserSession.prototype.decryptContent = function (content, options) {
        return storage.decryptContent(content, options, this);
    };
    /**
     * Stores the data provided in the app's data store to to the file specified.
     * @param {String} path - the path to store the data in
     * @param {String|Buffer} content - the data to store in the file
     * @param {Object} [options=null] - options object
     * @param {Boolean|String} [options.encrypt=true] - encrypt the data with the app private key
     *                                                  or the provided public key
     * @param {Boolean} [options.sign=false] - sign the data using ECDSA on SHA256 hashes with
     *                                         the app private key
     * @return {Promise} that resolves if the operation succeed and rejects
     * if it failed
     */
    UserSession.prototype.putFile = function (path, content, options) {
        return storage.putFile(path, content, options, this);
    };
    /**
     * Retrieves the specified file from the app's data store.
     * @param {String} path - the path to the file to read
     * @param {Object} [options=null] - options object
     * @param {Boolean} [options.decrypt=true] - try to decrypt the data with the app private key
     * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
     * @param {Boolean} options.verify - Whether the content should be verified, only to be used
     * when `putFile` was set to `sign = true`
     * @param {String} options.app - the app to lookup for multi-player storage -
     * defaults to current origin
     * @param {String} [options.zoneFileLookupURL=null] - The URL
     * to use for zonefile lookup. If falsey, this will use the
     * blockstack.js's getNameInfo function instead.
     * @returns {Promise} that resolves to the raw data in the file
     * or rejects with an error
     */
    UserSession.prototype.getFile = function (path, options) {
        return storage.getFile(path, options, this);
    };
    /**
     * Get the URL for reading a file from an app's data store.
     * @param {String} path - the path to the file to read
     * @param {Object} [options=null] - options object
     * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
     * @param {String} options.app - the app to lookup for multi-player storage -
     * defaults to current origin
     * @param {String} [options.zoneFileLookupURL=null] - The URL
     * to use for zonefile lookup. If falsey, this will use the
     * blockstack.js's getNameInfo function instead.
     * @returns {Promise<string>} that resolves to the URL or rejects with an error
     */
    UserSession.prototype.getFileUrl = function (path, options) {
        return storage.getFileUrl(path, options, this);
    };
    /**
     * List the set of files in this application's Gaia storage bucket.
     * @param {function} callback - a callback to invoke on each named file that
     * returns `true` to continue the listing operation or `false` to end it
     * @return {Promise} that resolves to the number of files listed
     */
    UserSession.prototype.listFiles = function (callback) {
        return storage.listFiles(callback, this);
    };
    /**
     * Deletes the specified file from the app's data store. Currently not implemented.
     * @param {String} path - the path to the file to delete
     * @returns {Promise} that resolves when the file has been removed
     * or rejects with an error
     */
    UserSession.prototype.deleteFile = function (path) {
        Promise.reject(new Error("Delete of " + path + " not supported by gaia hubs"));
    };
    UserSession.prototype.getOrSetLocalGaiaHubConnection = function () {
        var sessionData = this.store.getSessionData();
        var userData = sessionData.userData;
        if (!userData) {
            throw new errors_1.InvalidStateError('Missing userData');
        }
        var hubConfig = userData.gaiaHubConfig;
        if (hubConfig) {
            return Promise.resolve(hubConfig);
        }
        return this.setLocalGaiaHubConnection();
    };
    /**
     * These two functions are app-specific connections to gaia hub,
     *   they read the user data object for information on setting up
     *   a hub connection, and store the hub config to localstorage
     * @private
     * @returns {Promise} that resolves to the new gaia hub connection
     */
    UserSession.prototype.setLocalGaiaHubConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var userData, gaiaConfig, sessionData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userData = this.loadUserData();
                        if (!userData) {
                            throw new errors_1.InvalidStateError('Missing userData');
                        }
                        if (!userData.hubUrl) {
                            userData.hubUrl = authConstants_1.BLOCKSTACK_DEFAULT_GAIA_HUB_URL;
                        }
                        return [4 /*yield*/, hub_1.connectToGaiaHub(userData.hubUrl, userData.appPrivateKey, userData.associationToken)];
                    case 1:
                        gaiaConfig = _a.sent();
                        userData.gaiaHubConfig = gaiaConfig;
                        sessionData = this.store.getSessionData();
                        sessionData.userData.gaiaHubConfig = gaiaConfig;
                        this.store.setSessionData(sessionData);
                        return [2 /*return*/, gaiaConfig];
                }
            });
        });
    };
    return UserSession;
}());
exports.UserSession = UserSession;
//# sourceMappingURL=userSession.js.map