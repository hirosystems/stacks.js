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
Object.defineProperty(exports, "__esModule", { value: true });
var hub_1 = require("./hub");
exports.connectToGaiaHub = hub_1.connectToGaiaHub;
exports.uploadToGaiaHub = hub_1.uploadToGaiaHub;
exports.BLOCKSTACK_GAIA_HUB_LABEL = hub_1.BLOCKSTACK_GAIA_HUB_LABEL;
// export { type GaiaHubConfig } from './hub'
var ec_1 = require("../encryption/ec");
var keys_1 = require("../keys");
var profileLookup_1 = require("../profiles/profileLookup");
var errors_1 = require("../errors");
var logger_1 = require("../logger");
var userSession_1 = require("../auth/userSession");
var SIGNATURE_FILE_SUFFIX = '.sig';
/**
 * Deletes the specified file from the app's data store. Currently not implemented.
 * @param {String} path - the path to the file to delete
 * @returns {Promise} that resolves when the file has been removed
 * or rejects with an error
 */
function deleteFile(path) {
    Promise.reject(new Error("Delete of " + path + " not supported by gaia hubs"));
}
exports.deleteFile = deleteFile;
/**
 * Fetch the public read URL of a user file for the specified app.
 * @param {String} path - the path to the file to read
 * @param {String} username - The Blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {String} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @return {Promise<string>} that resolves to the public read URL of the file
 * or rejects with an error
 */
function getUserAppFileUrl(path, username, appOrigin, zoneFileLookupURL) {
    return __awaiter(this, void 0, void 0, function () {
        var profile, bucketUrl, url, bucket;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, profileLookup_1.lookupProfile(username, zoneFileLookupURL)];
                case 1:
                    profile = _a.sent();
                    bucketUrl = null;
                    if (profile.hasOwnProperty('apps')) {
                        if (profile.apps.hasOwnProperty(appOrigin)) {
                            url = profile.apps[appOrigin];
                            bucket = url.replace(/\/?(\?|#|$)/, '/$1');
                            bucketUrl = "" + bucket + path;
                        }
                    }
                    return [2 /*return*/, bucketUrl];
            }
        });
    });
}
exports.getUserAppFileUrl = getUserAppFileUrl;
/**
 * Encrypts the data provided with the app public key.
 * @param {String|Buffer} content - data to encrypt
 * @param {Object} [options=null] - options object
 * @param {String} options.publicKey - the hex string of the ECDSA public
 * key to use for encryption. If not provided, will use user's appPublicKey.
 * @return {String} Stringified ciphertext object
 */
function encryptContent(content, options, caller) {
    var opts = Object.assign({}, options);
    if (!opts.publicKey) {
        var privateKey = (caller || new userSession_1.UserSession()).loadUserData().appPrivateKey;
        opts.publicKey = keys_1.getPublicKeyFromPrivate(privateKey);
    }
    var cipherObject = ec_1.encryptECIES(opts.publicKey, content);
    return JSON.stringify(cipherObject);
}
exports.encryptContent = encryptContent;
/**
 * Decrypts data encrypted with `encryptContent` with the
 * transit private key.
 * @param {String|Buffer} content - encrypted content.
 * @param {Object} [options=null] - options object
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key to use for decryption. If not provided, will use user's appPrivateKey.
 * @return {String|Buffer} decrypted content.
 */
function decryptContent(content, options, caller) {
    var opts = Object.assign({}, options);
    if (!opts.privateKey) {
        opts.privateKey = (caller || new userSession_1.UserSession()).loadUserData().appPrivateKey;
    }
    try {
        var cipherObject = JSON.parse(content);
        return ec_1.decryptECIES(opts.privateKey, cipherObject);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            throw new Error('Failed to parse encrypted content JSON. The content may not '
                + 'be encrypted. If using getFile, try passing { decrypt: false }.');
        }
        else {
            throw err;
        }
    }
}
exports.decryptContent = decryptContent;
/* Get the gaia address used for servicing multiplayer reads for the given
 * (username, app) pair.
 * @private
 * @ignore
 */
function getGaiaAddress(app, username, zoneFileLookupURL, caller) {
    return __awaiter(this, void 0, void 0, function () {
        var opts, fileUrl, gaiaHubConfig, matches;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opts = normalizeOptions({ app: app, username: username }, caller);
                    if (!username) return [3 /*break*/, 2];
                    return [4 /*yield*/, getUserAppFileUrl('/', opts.username, opts.app, zoneFileLookupURL)];
                case 1:
                    fileUrl = _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    if (!caller) {
                        caller = new userSession_1.UserSession();
                    }
                    return [4 /*yield*/, caller.getOrSetLocalGaiaHubConnection()];
                case 3:
                    gaiaHubConfig = _a.sent();
                    return [4 /*yield*/, hub_1.getFullReadUrl('/', gaiaHubConfig)];
                case 4:
                    fileUrl = _a.sent();
                    _a.label = 5;
                case 5:
                    matches = fileUrl.match(/([13][a-km-zA-HJ-NP-Z0-9]{26,35})/);
                    if (!matches) {
                        throw new Error('Failed to parse gaia address');
                    }
                    return [2 /*return*/, matches[matches.length - 1]];
            }
        });
    });
}
/**
 * @param {Object} [options=null] - options object
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 */
function normalizeOptions(options, caller) {
    var opts = Object.assign({}, options);
    if (opts.username) {
        if (!opts.app) {
            var appConfig = (caller || new userSession_1.UserSession()).appConfig;
            if (!appConfig) {
                throw new errors_1.InvalidStateError('Missing AppConfig');
            }
            opts.app = appConfig.appDomain;
        }
    }
    return opts;
}
/**
 * @deprecated
 *
 * Use [[UserSession.getFileUrl]] instead.
 */
function getFileUrl(path, options, caller) {
    return __awaiter(this, void 0, void 0, function () {
        var opts, readUrl, gaiaHubConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opts = normalizeOptions(options, caller);
                    if (!opts.username) return [3 /*break*/, 2];
                    return [4 /*yield*/, getUserAppFileUrl(path, opts.username, opts.app, opts.zoneFileLookupURL)];
                case 1:
                    readUrl = _a.sent();
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, (caller || new userSession_1.UserSession()).getOrSetLocalGaiaHubConnection()];
                case 3:
                    gaiaHubConfig = _a.sent();
                    return [4 /*yield*/, hub_1.getFullReadUrl(path, gaiaHubConfig)];
                case 4:
                    readUrl = _a.sent();
                    _a.label = 5;
                case 5:
                    if (!readUrl) {
                        throw new Error('Missing readURL');
                    }
                    else {
                        return [2 /*return*/, readUrl];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.getFileUrl = getFileUrl;
/* Handle fetching the contents from a given path. Handles both
 *  multi-player reads and reads from own storage.
 * @private
 * @ignore
 */
function getFileContents(path, app, username, zoneFileLookupURL, forceText, caller) {
    return Promise.resolve()
        .then(function () {
        var opts = { app: app, username: username, zoneFileLookupURL: zoneFileLookupURL };
        return getFileUrl(path, opts, caller);
    })
        .then(function (readUrl) { return fetch(readUrl); })
        .then(function (response) {
        if (response.status !== 200) {
            if (response.status === 404) {
                logger_1.Logger.debug("getFile " + path + " returned 404, returning null");
                return null;
            }
            else {
                throw new Error("getFile " + path + " failed with HTTP status " + response.status);
            }
        }
        var contentType = response.headers.get('Content-Type');
        if (forceText || contentType === null
            || contentType.startsWith('text')
            || contentType === 'application/json') {
            return response.text();
        }
        else {
            return response.arrayBuffer();
        }
    });
}
/* Handle fetching an unencrypted file, its associated signature
 *  and then validate it. Handles both multi-player reads and reads
 *  from own storage.
 * @private
 * @ignore
 */
function getFileSignedUnencrypted(path, opt, caller) {
    // future optimization note:
    //    in the case of _multi-player_ reads, this does a lot of excess
    //    profile lookups to figure out where to read files
    //    do browsers cache all these requests if Content-Cache is set?
    return Promise.all([getFileContents(path, opt.app, opt.username, opt.zoneFileLookupURL, false, caller),
        getFileContents("" + path + SIGNATURE_FILE_SUFFIX, opt.app, opt.username, opt.zoneFileLookupURL, true, caller),
        getGaiaAddress(opt.app, opt.username, opt.zoneFileLookupURL, caller)])
        .then(function (_a) {
        var fileContents = _a[0], signatureContents = _a[1], gaiaAddress = _a[2];
        if (!fileContents) {
            return fileContents;
        }
        if (!gaiaAddress) {
            throw new errors_1.SignatureVerificationError('Failed to get gaia address for verification of: '
                + ("" + path));
        }
        if (!signatureContents || typeof signatureContents !== 'string') {
            throw new errors_1.SignatureVerificationError('Failed to obtain signature for file: '
                + (path + " -- looked in " + path + SIGNATURE_FILE_SUFFIX));
        }
        var signature;
        var publicKey;
        try {
            var sigObject = JSON.parse(signatureContents);
            signature = sigObject.signature;
            publicKey = sigObject.publicKey;
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error('Failed to parse signature content JSON '
                    + ("(path: " + path + SIGNATURE_FILE_SUFFIX + ")")
                    + ' The content may be corrupted.');
            }
            else {
                throw err;
            }
        }
        var signerAddress = keys_1.publicKeyToAddress(publicKey);
        if (gaiaAddress !== signerAddress) {
            throw new errors_1.SignatureVerificationError("Signer pubkey address (" + signerAddress + ") doesn't"
                + (" match gaia address (" + gaiaAddress + ")"));
        }
        else if (!ec_1.verifyECDSA(fileContents, publicKey, signature)) {
            throw new errors_1.SignatureVerificationError('Contents do not match ECDSA signature: '
                + ("path: " + path + ", signature: " + path + SIGNATURE_FILE_SUFFIX));
        }
        else {
            return fileContents;
        }
    });
}
/* Handle signature verification and decryption for contents which are
 *  expected to be signed and encrypted. This works for single and
 *  multiplayer reads. In the case of multiplayer reads, it uses the
 *  gaia address for verification of the claimed public key.
 * @private
 * @ignore
 */
function handleSignedEncryptedContents(caller, path, storedContents, app, username, zoneFileLookupURL) {
    var appPrivateKey = caller.loadUserData().appPrivateKey;
    var appPublicKey = keys_1.getPublicKeyFromPrivate(appPrivateKey);
    var addressPromise;
    if (username) {
        addressPromise = getGaiaAddress(app, username, zoneFileLookupURL, caller);
    }
    else {
        var address = keys_1.publicKeyToAddress(appPublicKey);
        addressPromise = Promise.resolve(address);
    }
    return addressPromise.then(function (address) {
        if (!address) {
            throw new errors_1.SignatureVerificationError('Failed to get gaia address for verification of: '
                + ("" + path));
        }
        var sigObject;
        try {
            sigObject = JSON.parse(storedContents);
        }
        catch (err) {
            if (err instanceof SyntaxError) {
                throw new Error('Failed to parse encrypted, signed content JSON. The content may not '
                    + 'be encrypted. If using getFile, try passing'
                    + ' { verify: false, decrypt: false }.');
            }
            else {
                throw err;
            }
        }
        var signature = sigObject.signature;
        var signerPublicKey = sigObject.publicKey;
        var cipherText = sigObject.cipherText;
        var signerAddress = keys_1.publicKeyToAddress(signerPublicKey);
        if (!signerPublicKey || !cipherText || !signature) {
            throw new errors_1.SignatureVerificationError('Failed to get signature verification data from file:'
                + (" " + path));
        }
        else if (signerAddress !== address) {
            throw new errors_1.SignatureVerificationError("Signer pubkey address (" + signerAddress + ") doesn't"
                + (" match gaia address (" + address + ")"));
        }
        else if (!ec_1.verifyECDSA(cipherText, signerPublicKey, signature)) {
            throw new errors_1.SignatureVerificationError('Contents do not match ECDSA signature in file:'
                + (" " + path));
        }
        else {
            return caller.decryptContent(cipherText);
        }
    });
}
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
function getFile(path, options, caller) {
    var defaults = {
        decrypt: true,
        verify: false,
        username: null,
        app: typeof window !== 'undefined' ? window.location.origin : undefined,
        zoneFileLookupURL: null
    };
    var opt = Object.assign({}, defaults, options);
    if (!caller) {
        caller = new userSession_1.UserSession();
    }
    // in the case of signature verification, but no
    //  encryption expected, need to fetch _two_ files.
    if (opt.verify && !opt.decrypt) {
        return getFileSignedUnencrypted(path, opt, caller);
    }
    return getFileContents(path, opt.app, opt.username, opt.zoneFileLookupURL, !!opt.decrypt, caller)
        .then(function (storedContents) {
        if (storedContents === null) {
            return storedContents;
        }
        else if (opt.decrypt && !opt.verify) {
            if (typeof storedContents !== 'string') {
                throw new Error('Expected to get back a string for the cipherText');
            }
            return caller.decryptContent(storedContents);
        }
        else if (opt.decrypt && opt.verify) {
            if (typeof storedContents !== 'string') {
                throw new Error('Expected to get back a string for the cipherText');
            }
            return handleSignedEncryptedContents(caller, path, storedContents, opt.app, opt.username, opt.zoneFileLookupURL);
        }
        else if (!opt.verify && !opt.decrypt) {
            return storedContents;
        }
        else {
            throw new Error('Should be unreachable.');
        }
    });
}
exports.getFile = getFile;
/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Object} [options=null] - options object
 * @param {Boolean|String} [options.encrypt=true] - encrypt the data with the app public key
 *                                                  or the provided public key
 * @param {Boolean} [options.sign=false] - sign the data using ECDSA on SHA256 hashes with
 *                                         the app private key
 * @param {String} [options.contentType=''] - set a Content-Type header for unencrypted data
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
function putFile(path, content, options, caller) {
    return __awaiter(this, void 0, void 0, function () {
        var defaults, opt, contentType, privateKey, publicKey, signatureObject, signatureContent, gaiaHubConfig_1, fileUrls, error_1, freshHubConfig, fileUrls, cipherText, signatureObject, signedCipherObject, gaiaHubConfig, error_2, freshHubConfig, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    defaults = {
                        encrypt: true,
                        sign: false,
                        contentType: ''
                    };
                    opt = Object.assign({}, defaults, options);
                    contentType = opt.contentType;
                    if (!contentType) {
                        contentType = (typeof (content) === 'string') ? 'text/plain; charset=utf-8' : 'application/octet-stream';
                    }
                    if (!caller) {
                        caller = new userSession_1.UserSession();
                    }
                    privateKey = '';
                    publicKey = '';
                    if (opt.sign) {
                        if (typeof (opt.sign) === 'string') {
                            privateKey = opt.sign;
                        }
                        else {
                            privateKey = caller.loadUserData().appPrivateKey;
                        }
                    }
                    if (opt.encrypt) {
                        if (typeof (opt.encrypt) === 'string') {
                            publicKey = opt.encrypt;
                        }
                        else {
                            if (!privateKey) {
                                privateKey = caller.loadUserData().appPrivateKey;
                            }
                            publicKey = keys_1.getPublicKeyFromPrivate(privateKey);
                        }
                    }
                    if (!(!opt.encrypt && opt.sign)) return [3 /*break*/, 7];
                    signatureObject = ec_1.signECDSA(privateKey, content);
                    signatureContent = JSON.stringify(signatureObject);
                    return [4 /*yield*/, caller.getOrSetLocalGaiaHubConnection()];
                case 1:
                    gaiaHubConfig_1 = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 7]);
                    return [4 /*yield*/, Promise.all([
                            hub_1.uploadToGaiaHub(path, content, gaiaHubConfig_1, contentType),
                            hub_1.uploadToGaiaHub("" + path + SIGNATURE_FILE_SUFFIX, signatureContent, gaiaHubConfig_1, 'application/json')
                        ])];
                case 3:
                    fileUrls = _a.sent();
                    return [2 /*return*/, fileUrls[0]];
                case 4:
                    error_1 = _a.sent();
                    return [4 /*yield*/, caller.setLocalGaiaHubConnection()];
                case 5:
                    freshHubConfig = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            hub_1.uploadToGaiaHub(path, content, freshHubConfig, contentType),
                            hub_1.uploadToGaiaHub("" + path + SIGNATURE_FILE_SUFFIX, signatureContent, freshHubConfig, 'application/json')
                        ])];
                case 6:
                    fileUrls = _a.sent();
                    return [2 /*return*/, fileUrls[0]];
                case 7:
                    // In all other cases, we only need one upload.
                    if (opt.encrypt && !opt.sign) {
                        content = encryptContent(content, { publicKey: publicKey });
                        contentType = 'application/json';
                    }
                    else if (opt.encrypt && opt.sign) {
                        cipherText = encryptContent(content, { publicKey: publicKey });
                        signatureObject = ec_1.signECDSA(privateKey, cipherText);
                        signedCipherObject = {
                            signature: signatureObject.signature,
                            publicKey: signatureObject.publicKey,
                            cipherText: cipherText
                        };
                        content = JSON.stringify(signedCipherObject);
                        contentType = 'application/json';
                    }
                    return [4 /*yield*/, caller.getOrSetLocalGaiaHubConnection()];
                case 8:
                    gaiaHubConfig = _a.sent();
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 14]);
                    return [4 /*yield*/, hub_1.uploadToGaiaHub(path, content, gaiaHubConfig, contentType)];
                case 10: return [2 /*return*/, _a.sent()];
                case 11:
                    error_2 = _a.sent();
                    return [4 /*yield*/, caller.setLocalGaiaHubConnection()];
                case 12:
                    freshHubConfig = _a.sent();
                    return [4 /*yield*/, hub_1.uploadToGaiaHub(path, content, freshHubConfig, contentType)];
                case 13:
                    file = _a.sent();
                    return [2 /*return*/, file];
                case 14: return [2 /*return*/];
            }
        });
    });
}
exports.putFile = putFile;
/**
 * Get the app storage bucket URL
 * @param {String} gaiaHubUrl - the gaia hub URL
 * @param {String} appPrivateKey - the app private key used to generate the app address
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
function getAppBucketUrl(gaiaHubUrl, appPrivateKey) {
    return hub_1.getBucketUrl(gaiaHubUrl, appPrivateKey);
}
exports.getAppBucketUrl = getAppBucketUrl;
/**
 * Loop over the list of files in a Gaia hub, and run a callback on each entry.
 * Not meant to be called by external clients.
 * @param {GaiaHubConfig} hubConfig - the Gaia hub config
 * @param {String | null} page - the page ID
 * @param {number} callCount - the loop count
 * @param {number} fileCount - the number of files listed so far
 * @param {function} callback - the callback to invoke on each file.  If it returns a falsey
 *  value, then the loop stops.  If it returns a truthy value, the loop continues.
 * @returns {Promise} that resolves to the number of files listed.
 * @private
 * @ignore
 */
function listFilesLoop(hubConfig, page, callCount, fileCount, callback) {
    if (callCount > 65536) {
        // this is ridiculously huge, and probably indicates
        // a faulty Gaia hub anyway (e.g. on that serves endless data)
        throw new Error('Too many entries to list');
    }
    var httpStatus;
    var pageRequest = JSON.stringify({ page: page });
    var fetchOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': "" + pageRequest.length,
            Authorization: "bearer " + hubConfig.token
        },
        body: pageRequest
    };
    return fetch(hubConfig.server + "/list-files/" + hubConfig.address, fetchOptions)
        .then(function (response) {
        httpStatus = response.status;
        if (httpStatus >= 400) {
            throw new Error("listFiles failed with HTTP status " + httpStatus);
        }
        return response.text();
    })
        .then(function (responseText) { return JSON.parse(responseText); })
        .then(function (responseJSON) {
        var entries = responseJSON.entries;
        var nextPage = responseJSON.page;
        if (entries === null || entries === undefined) {
            // indicates a misbehaving Gaia hub or a misbehaving driver
            // (i.e. the data is malformed)
            throw new Error('Bad listFiles response: no entries');
        }
        for (var i = 0; i < entries.length; i++) {
            var rc = callback(entries[i]);
            if (!rc) {
                // callback indicates that we're done
                return Promise.resolve(fileCount + i);
            }
        }
        if (nextPage && entries.length > 0) {
            // keep going -- have more entries
            return listFilesLoop(hubConfig, nextPage, callCount + 1, fileCount + entries.length, callback);
        }
        else {
            // no more entries -- end of data
            return Promise.resolve(fileCount + entries.length);
        }
    });
}
/**
 * List the set of files in this application's Gaia storage bucket.
 * @param {UserSession} caller - instance calling this method
 * @param {function} callback - a callback to invoke on each named file that
 * returns `true` to continue the listing operation or `false` to end it
 * @return {Promise} that resolves to the number of files listed
 */
function listFiles(callback, caller) {
    return __awaiter(this, void 0, void 0, function () {
        var userSession, gaiaHubConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    userSession = caller || new userSession_1.UserSession();
                    return [4 /*yield*/, userSession.getOrSetLocalGaiaHubConnection()];
                case 1:
                    gaiaHubConfig = _a.sent();
                    return [2 /*return*/, listFilesLoop(gaiaHubConfig, null, 0, 0, callback)];
            }
        });
    });
}
exports.listFiles = listFiles;
//# sourceMappingURL=index.js.map