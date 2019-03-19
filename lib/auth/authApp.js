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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var query_string_1 = __importDefault(require("query-string"));
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var index_1 = require("./index");
var utils_1 = require("../utils");
var index_2 = require("../index");
var errors_1 = require("../errors");
var authMessages_1 = require("./authMessages");
var authConstants_1 = require("./authConstants");
var profiles_1 = require("../profiles");
var userSession_1 = require("./userSession");
var config_1 = require("../config");
var logger_1 = require("../logger");
var DEFAULT_PROFILE = {
    '@type': 'Person',
    '@context': 'http://schema.org'
};
/**
 * Check if a user is currently signed in.
 * @method isUserSignedIn
 * @return {Boolean} `true` if the user is signed in, `false` if not.
 */
function isUserSignedIn() {
    console.warn('DEPRECATION WARNING: The static isUserSignedIn() function will be deprecated in '
        + 'the next major release of blockstack.js. Create an instance of UserSession and call the '
        + 'instance method isUserSignedIn().');
    var userSession = new userSession_1.UserSession();
    return userSession.isUserSignedIn();
}
exports.isUserSignedIn = isUserSignedIn;
/**
 * Generates an authentication request and redirects the user to the Blockstack
 * browser to approve the sign in request.
 *
 * Please note that this requires that the web browser properly handles the
 * `blockstack:` URL protocol handler.
 *
 * Most applications should use this
 * method for sign in unless they require more fine grained control over how the
 * authentication request is generated. If your app falls into this category,
 * use `makeAuthRequest` and `redirectToSignInWithAuthRequest` to build your own sign in process.
 *
 * @param {String} [redirectURI=`${window.location.origin}/`]
 * The location to which the identity provider will redirect the user after
 * the user approves sign in.
 * @param  {String} [manifestURI=`${window.location.origin}/manifest.json`]
 * Location of the manifest file.
 * @param  {Array} [scopes=DEFAULT_SCOPE] Defaults to requesting write access to
 * this app's data store.
 * An array of strings indicating which permissions this app is requesting.
 * @return {void}
 */
function redirectToSignIn(redirectURI, manifestURI, scopes) {
    console.warn('DEPRECATION WARNING: The static redirectToSignIn() function will be deprecated in the '
        + 'next major release of blockstack.js. Create an instance of UserSession and call the '
        + 'instance method redirectToSignIn().');
    var authRequest = authMessages_1.makeAuthRequest(null, redirectURI, manifestURI, scopes);
    redirectToSignInWithAuthRequest(authRequest);
}
exports.redirectToSignIn = redirectToSignIn;
/**
 * Check if there is a authentication request that hasn't been handled.
 * @return {Boolean} `true` if there is a pending sign in, otherwise `false`
 */
function isSignInPending() {
    return !!getAuthResponseToken();
}
exports.isSignInPending = isSignInPending;
/**
 * Retrieve the authentication token from the URL query
 * @return {String} the authentication token if it exists otherwise `null`
 */
function getAuthResponseToken() {
    utils_1.checkWindowAPI('getAuthResponseToken', 'location');
    var queryDict = query_string_1.default.parse(window.location.search);
    return queryDict.authResponse ? queryDict.authResponse : '';
}
exports.getAuthResponseToken = getAuthResponseToken;
/**
 * Retrieves the user data object. The user's profile is stored in the key `profile`.
 * @return {Object} User data object.
 */
function loadUserData() {
    console.warn('DEPRECATION WARNING: The static loadUserData() function will be deprecated in the '
        + 'next major release of blockstack.js. Create an instance of UserSession and call the '
        + 'instance method loadUserData().');
    var userSession = new userSession_1.UserSession();
    return userSession.loadUserData();
}
exports.loadUserData = loadUserData;
/**
 * Sign the user out and optionally redirect to given location.
 * @param  redirectURL
 * Location to redirect user to after sign out.
 * Only used in environments with `window` available
 */
function signUserOut(redirectURL, caller) {
    var userSession = caller || new userSession_1.UserSession();
    userSession.store.deleteSessionData();
    if (redirectURL) {
        if (typeof window !== 'undefined') {
            window.location.href = redirectURL;
        }
        else {
            var errMsg = '`signUserOut` called with `redirectURL` specified'
                + (" (\"" + redirectURL + "\")")
                + ' but `window.location.href` is not available in this environment';
            logger_1.Logger.error(errMsg);
            throw new Error(errMsg);
        }
    }
}
exports.signUserOut = signUserOut;
/**
 * Detects if the native auth-browser is installed and is successfully
 * launched via a custom protocol URI.
 * @param {String} authRequest
 * The encoded authRequest to be used as a query param in the custom URI.
 * @param {String} successCallback
 * The callback that is invoked when the protocol handler was detected.
 * @param {String} failCallback
 * The callback that is invoked when the protocol handler was not detected.
 * @return {void}
 */
function detectProtocolLaunch(authRequest, successCallback, failCallback) {
    // Create a unique ID used for this protocol detection attempt.
    var echoReplyID = Math.random().toString(36).substr(2, 9);
    var echoReplyKeyPrefix = 'echo-reply-';
    var echoReplyKey = "" + echoReplyKeyPrefix + echoReplyID;
    var apis = ['localStorage', 'document', 'setTimeout', 'clearTimeout', 'addEventListener', 'removeEventListener'];
    apis.forEach(function (windowAPI) { return utils_1.checkWindowAPI('detectProtocolLaunch', windowAPI); });
    // Use localStorage as a reliable cross-window communication method.
    // Create the storage entry to signal a protocol detection attempt for the
    // next browser window to check.
    window.localStorage.setItem(echoReplyKey, Date.now().toString());
    var cleanUpLocalStorage = function () {
        try {
            window.localStorage.removeItem(echoReplyKey);
            // Also clear out any stale echo-reply keys older than 1 hour.
            for (var i = 0; i < window.localStorage.length; i++) {
                var storageKey = window.localStorage.key(i);
                if (storageKey && storageKey.startsWith(echoReplyKeyPrefix)) {
                    var storageValue = window.localStorage.getItem(storageKey);
                    if (storageValue === 'success' || (Date.now() - parseInt(storageValue, 10)) > 3600000) {
                        window.localStorage.removeItem(storageKey);
                    }
                }
            }
        }
        catch (err) {
            logger_1.Logger.error('Exception cleaning up echo-reply entries in localStorage');
            logger_1.Logger.error(err);
        }
    };
    var detectionTimeout = 1000;
    var redirectToWebAuthTimer = 0;
    var cancelWebAuthRedirectTimer = function () {
        if (redirectToWebAuthTimer) {
            window.clearTimeout(redirectToWebAuthTimer);
            redirectToWebAuthTimer = 0;
        }
    };
    var startWebAuthRedirectTimer = function (timeout) {
        if (timeout === void 0) { timeout = detectionTimeout; }
        cancelWebAuthRedirectTimer();
        redirectToWebAuthTimer = window.setTimeout(function () {
            if (redirectToWebAuthTimer) {
                cancelWebAuthRedirectTimer();
                var nextFunc_1;
                if (window.localStorage.getItem(echoReplyKey) === 'success') {
                    logger_1.Logger.info('Protocol echo reply detected.');
                    nextFunc_1 = successCallback;
                }
                else {
                    logger_1.Logger.info('Protocol handler not detected.');
                    nextFunc_1 = failCallback;
                }
                failCallback = function () { };
                successCallback = function () { };
                cleanUpLocalStorage();
                // Briefly wait since localStorage changes can 
                // sometimes be ignored when immediately redirected.
                setTimeout(function () { return nextFunc_1(); }, 100);
            }
        }, timeout);
    };
    startWebAuthRedirectTimer();
    var inputPromptTracker = window.document.createElement('input');
    inputPromptTracker.type = 'text';
    var inputStyle = inputPromptTracker.style;
    // Prevent this element from inherited any css.
    inputStyle.all = 'initial';
    // Setting display=none on an element prevents them from being focused/blurred.
    // So hide the element using other properties..
    inputStyle.opacity = '0';
    inputStyle.filter = 'alpha(opacity=0)';
    inputStyle.height = '0';
    inputStyle.width = '0';
    // If the the focus of a page element is immediately changed then this likely indicates 
    // the protocol handler is installed, and the browser is prompting the user if they want 
    // to open the application. 
    var inputBlurredFunc = function () {
        // Use a timeout of 100ms to ignore instant toggles between blur and focus.
        // Browsers often perform an instant blur & focus when the protocol handler is working
        // but not showing any browser prompts, so we want to ignore those instances.
        var isRefocused = false;
        inputPromptTracker.addEventListener('focus', function () { isRefocused = true; }, { once: true, capture: true });
        setTimeout(function () {
            if (redirectToWebAuthTimer && !isRefocused) {
                logger_1.Logger.info('Detected possible browser prompt for opening the protocol handler app.');
                window.clearTimeout(redirectToWebAuthTimer);
                inputPromptTracker.addEventListener('focus', function () {
                    if (redirectToWebAuthTimer) {
                        logger_1.Logger.info('Possible browser prompt closed, restarting auth redirect timeout.');
                        startWebAuthRedirectTimer();
                    }
                }, { once: true, capture: true });
            }
        }, 100);
    };
    inputPromptTracker.addEventListener('blur', inputBlurredFunc, { once: true, capture: true });
    setTimeout(function () { return inputPromptTracker.removeEventListener('blur', inputBlurredFunc); }, 200);
    window.document.body.appendChild(inputPromptTracker);
    inputPromptTracker.focus();
    // Detect if document.visibility is immediately changed which is a strong 
    // indication that the protocol handler is working. We don't know for sure and 
    // can't predict future browser changes, so only increase the redirect timeout.
    // This reduces the probability of a false-negative (where local auth works, but 
    // the original page was redirect to web auth because something took too long),
    var pageVisibilityChanged = function () {
        if (window.document.hidden && redirectToWebAuthTimer) {
            logger_1.Logger.info('Detected immediate page visibility change (protocol handler probably working).');
            startWebAuthRedirectTimer(3000);
        }
    };
    window.document.addEventListener('visibilitychange', pageVisibilityChanged, { once: true, capture: true });
    setTimeout(function () { return window.document.removeEventListener('visibilitychange', pageVisibilityChanged); }, 500);
    // Listen for the custom protocol echo reply via localStorage update event.
    window.addEventListener('storage', function replyEventListener(event) {
        if (event.key === echoReplyKey && window.localStorage.getItem(echoReplyKey) === 'success') {
            // Custom protocol worked, cancel the web auth redirect timer.
            cancelWebAuthRedirectTimer();
            inputPromptTracker.removeEventListener('blur', inputBlurredFunc);
            logger_1.Logger.info('Protocol echo reply detected from localStorage event.');
            // Clean up event listener and localStorage.
            window.removeEventListener('storage', replyEventListener);
            var nextFunc_2 = successCallback;
            successCallback = function () { };
            failCallback = function () { };
            cleanUpLocalStorage();
            // Briefly wait since localStorage changes can sometimes 
            // be ignored when immediately redirected.
            setTimeout(function () { return nextFunc_2(); }, 100);
        }
    }, false);
    // Use iframe technique for launching the protocol URI rather than setting `window.location`.
    // This method prevents browsers like Safari, Opera, Firefox from showing error prompts
    // about unknown protocol handler when app is not installed, and avoids an empty
    // browser tab when the app is installed. 
    logger_1.Logger.info('Attempting protocol launch via iframe injection.');
    var locationSrc = utils_1.BLOCKSTACK_HANDLER + ":" + authRequest + "&echo=" + echoReplyID;
    var iframe = window.document.createElement('iframe');
    var iframeStyle = iframe.style;
    iframeStyle.all = 'initial';
    iframeStyle.display = 'none';
    iframe.src = locationSrc;
    window.document.body.appendChild(iframe);
}
/**
 * Redirects the user to the Blockstack browser to approve the sign in request
 * given.
 *
 * The user is redirected to the `blockstackIDHost` if the `blockstack:`
 * protocol handler is not detected. Please note that the protocol handler detection
 * does not work on all browsers.
 * @param  {String} authRequest - the authentication request generated by `makeAuthRequest`
 * @param  {String} blockstackIDHost - the URL to redirect the user to if the blockstack
 *                                     protocol handler is not detected
 * @return {void}
 */
function redirectToSignInWithAuthRequest(authRequest, blockstackIDHost) {
    if (blockstackIDHost === void 0) { blockstackIDHost = authConstants_1.DEFAULT_BLOCKSTACK_HOST; }
    authRequest = authRequest || authMessages_1.makeAuthRequest();
    var httpsURI = blockstackIDHost + "?authRequest=" + authRequest;
    utils_1.checkWindowAPI('redirectToSignInWithAuthRequest', 'navigator');
    utils_1.checkWindowAPI('redirectToSignInWithAuthRequest', 'location');
    // If they're on a mobile OS, always redirect them to HTTPS site
    if (/Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(window.navigator.userAgent)) {
        logger_1.Logger.info('detected mobile OS, sending to https');
        window.location.href = httpsURI;
        return;
    }
    function successCallback() {
        logger_1.Logger.info('protocol handler detected');
        // The detection function should open the link for us
    }
    function failCallback() {
        logger_1.Logger.warn('protocol handler not detected');
        window.location.href = httpsURI;
    }
    detectProtocolLaunch(authRequest, successCallback, failCallback);
}
exports.redirectToSignInWithAuthRequest = redirectToSignInWithAuthRequest;
/**
 * Try to process any pending sign in request by returning a `Promise` that resolves
 * to the user data object if the sign in succeeds.
 *
 * @param {String} nameLookupURL - the endpoint against which to verify public
 * keys match claimed username
 * @param {String} authResponseToken - the signed authentication response token
 * @param {String} transitKey - the transit private key that corresponds to the transit public key
 * that was provided in the authentication request
 * @return {Promise} that resolves to the user data object if successful and rejects
 * if handling the sign in request fails or there was no pending sign in request.
 */
function handlePendingSignIn(nameLookupURL, authResponseToken, transitKey, caller) {
    if (nameLookupURL === void 0) { nameLookupURL = ''; }
    if (authResponseToken === void 0) { authResponseToken = getAuthResponseToken(); }
    return __awaiter(this, void 0, void 0, function () {
        var tokenPayload_1, isValid, tokenPayload, appPrivateKey, coreSessionToken, hubUrl, gaiaAssociationToken, userData, profileURL, response, responseText, wrappedProfile, profile, sessionData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!caller) {
                        caller = new userSession_1.UserSession();
                    }
                    if (!transitKey) {
                        transitKey = caller.store.getSessionData().transitKey;
                    }
                    if (!nameLookupURL) {
                        tokenPayload_1 = jsontokens_1.decodeToken(authResponseToken).payload;
                        if (utils_1.isLaterVersion(tokenPayload_1.version, '1.3.0')
                            && tokenPayload_1.blockstackAPIUrl !== null && tokenPayload_1.blockstackAPIUrl !== undefined) {
                            // override globally
                            logger_1.Logger.info("Overriding " + config_1.config.network.blockstackAPIUrl + " "
                                + ("with " + tokenPayload_1.blockstackAPIUrl));
                            config_1.config.network.blockstackAPIUrl = tokenPayload_1.blockstackAPIUrl;
                        }
                        nameLookupURL = "" + config_1.config.network.blockstackAPIUrl + authConstants_1.NAME_LOOKUP_PATH;
                    }
                    return [4 /*yield*/, index_1.verifyAuthResponse(authResponseToken, nameLookupURL)];
                case 1:
                    isValid = _a.sent();
                    if (!isValid) {
                        throw new errors_1.LoginFailedError('Invalid authentication response.');
                    }
                    tokenPayload = jsontokens_1.decodeToken(authResponseToken).payload;
                    appPrivateKey = tokenPayload.private_key;
                    coreSessionToken = tokenPayload.core_token;
                    if (utils_1.isLaterVersion(tokenPayload.version, '1.1.0')) {
                        if (transitKey !== undefined && transitKey != null) {
                            if (tokenPayload.private_key !== undefined && tokenPayload.private_key !== null) {
                                try {
                                    appPrivateKey = authMessages_1.decryptPrivateKey(transitKey, tokenPayload.private_key);
                                }
                                catch (e) {
                                    logger_1.Logger.warn('Failed decryption of appPrivateKey, will try to use as given');
                                    try {
                                        utils_1.hexStringToECPair(tokenPayload.private_key);
                                    }
                                    catch (ecPairError) {
                                        throw new errors_1.LoginFailedError('Failed decrypting appPrivateKey. Usually means'
                                            + ' that the transit key has changed during login.');
                                    }
                                }
                            }
                            if (coreSessionToken !== undefined && coreSessionToken !== null) {
                                try {
                                    coreSessionToken = authMessages_1.decryptPrivateKey(transitKey, coreSessionToken);
                                }
                                catch (e) {
                                    logger_1.Logger.info('Failed decryption of coreSessionToken, will try to use as given');
                                }
                            }
                        }
                        else {
                            throw new errors_1.LoginFailedError('Authenticating with protocol > 1.1.0 requires transit'
                                + ' key, and none found.');
                        }
                    }
                    hubUrl = authConstants_1.BLOCKSTACK_DEFAULT_GAIA_HUB_URL;
                    if (utils_1.isLaterVersion(tokenPayload.version, '1.2.0')
                        && tokenPayload.hubUrl !== null && tokenPayload.hubUrl !== undefined) {
                        hubUrl = tokenPayload.hubUrl;
                    }
                    if (utils_1.isLaterVersion(tokenPayload.version, '1.3.0')
                        && tokenPayload.associationToken !== null && tokenPayload.associationToken !== undefined) {
                        gaiaAssociationToken = tokenPayload.associationToken;
                    }
                    userData = {
                        username: tokenPayload.username,
                        profile: tokenPayload.profile,
                        email: tokenPayload.email,
                        decentralizedID: tokenPayload.iss,
                        identityAddress: index_2.getAddressFromDID(tokenPayload.iss),
                        appPrivateKey: appPrivateKey,
                        coreSessionToken: coreSessionToken,
                        authResponseToken: authResponseToken,
                        hubUrl: hubUrl,
                        gaiaAssociationToken: gaiaAssociationToken
                    };
                    profileURL = tokenPayload.profile_url;
                    if (!(!userData.profile && profileURL)) return [3 /*break*/, 6];
                    return [4 /*yield*/, fetch(profileURL)];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    userData.profile = Object.assign({}, DEFAULT_PROFILE);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, response.text()];
                case 4:
                    responseText = _a.sent();
                    wrappedProfile = JSON.parse(responseText);
                    profile = profiles_1.extractProfile(wrappedProfile[0].token);
                    userData.profile = profile;
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    userData.profile = tokenPayload.profile;
                    _a.label = 7;
                case 7:
                    sessionData = caller.store.getSessionData();
                    sessionData.userData = userData;
                    caller.store.setSessionData(sessionData);
                    return [2 /*return*/, userData];
            }
        });
    });
}
exports.handlePendingSignIn = handlePendingSignIn;
//# sourceMappingURL=authApp.js.map