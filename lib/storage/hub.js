"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var crypto_1 = __importDefault(require("crypto"));
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var utils_1 = require("../utils");
var index_1 = require("../index");
var authConstants_1 = require("../auth/authConstants");
var logger_1 = require("../logger");
var errors_1 = require("../errors");
exports.BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config';
function uploadToGaiaHub(filename, contents, hubConfig, contentType) {
    if (contentType === void 0) { contentType = 'application/octet-stream'; }
    logger_1.Logger.debug("uploadToGaiaHub: uploading " + filename + " to " + hubConfig.server);
    return fetch(hubConfig.server + "/store/" + hubConfig.address + "/" + filename, {
        method: 'POST',
        headers: {
            'Content-Type': contentType,
            Authorization: "bearer " + hubConfig.token
        },
        body: contents
    })
        .then(function (response) {
        if (response.ok) {
            return response.text();
        }
        else {
            throw new Error('Error when uploading to Gaia hub');
        }
    })
        .then(function (responseText) { return JSON.parse(responseText); })
        .then(function (responseJSON) { return responseJSON.publicURL; });
}
exports.uploadToGaiaHub = uploadToGaiaHub;
function getFullReadUrl(filename, hubConfig) {
    return "" + hubConfig.url_prefix + hubConfig.address + "/" + filename;
}
exports.getFullReadUrl = getFullReadUrl;
function makeLegacyAuthToken(challengeText, signerKeyHex) {
    // only sign specific legacy auth challenges.
    var parsedChallenge;
    try {
        parsedChallenge = JSON.parse(challengeText);
    }
    catch (err) {
        throw new Error('Failed in parsing legacy challenge text from the gaia hub.');
    }
    if (parsedChallenge[0] === 'gaiahub'
        && parsedChallenge[3] === 'blockstack_storage_please_sign') {
        var signer = index_1.hexStringToECPair(signerKeyHex
            + (signerKeyHex.length === 64 ? '01' : ''));
        var digest = bitcoinjs_lib_1.default.crypto.sha256(Buffer.from(challengeText));
        var signatureBuffer = signer.sign(digest);
        var signatureWithHash = bitcoinjs_lib_1.default.script.signature.encode(signatureBuffer, bitcoinjs_lib_1.default.Transaction.SIGHASH_NONE);
        // We only want the DER encoding so remove the sighash version byte at the end.
        // See: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1241#issuecomment-428062912
        var signature = signatureWithHash.toString('hex').slice(0, -2);
        var publickey = index_1.getPublicKeyFromPrivate(signerKeyHex);
        var token = Buffer.from(JSON.stringify({ publickey: publickey, signature: signature })).toString('base64');
        return token;
    }
    else {
        throw new Error('Failed to connect to legacy gaia hub. If you operate this hub, please update.');
    }
}
function makeV1GaiaAuthToken(hubInfo, signerKeyHex, hubUrl, associationToken) {
    var challengeText = hubInfo.challenge_text;
    var handlesV1Auth = (hubInfo.latest_auth_version
        && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1);
    var iss = index_1.getPublicKeyFromPrivate(signerKeyHex);
    if (!handlesV1Auth) {
        return makeLegacyAuthToken(challengeText, signerKeyHex);
    }
    var salt = crypto_1.default.randomBytes(16).toString('hex');
    var payload = {
        gaiaChallenge: challengeText,
        hubUrl: hubUrl,
        iss: iss,
        salt: salt,
        associationToken: associationToken
    };
    var token = new jsontokens_1.TokenSigner('ES256K', signerKeyHex).sign(payload);
    return "v1:" + token;
}
function connectToGaiaHub(gaiaHubUrl, challengeSignerHex, associationToken) {
    logger_1.Logger.debug("connectToGaiaHub: " + gaiaHubUrl + "/hub_info");
    return fetch(gaiaHubUrl + "/hub_info")
        .then(function (response) { return response.json(); })
        .then(function (hubInfo) {
        var readURL = hubInfo.read_url_prefix;
        var token = makeV1GaiaAuthToken(hubInfo, challengeSignerHex, gaiaHubUrl, associationToken);
        var address = utils_1.ecPairToAddress(index_1.hexStringToECPair(challengeSignerHex
            + (challengeSignerHex.length === 64 ? '01' : '')));
        return {
            url_prefix: readURL,
            address: address,
            token: token,
            server: gaiaHubUrl
        };
    });
}
exports.connectToGaiaHub = connectToGaiaHub;
/**
 * These two functions are app-specific connections to gaia hub,
 *   they read the user data object for information on setting up
 *   a hub connection, and store the hub config to localstorage
 * @param {UserSession} caller - the instance calling this function
 * @private
 * @returns {Promise} that resolves to the new gaia hub connection
 */
function setLocalGaiaHubConnection(caller) {
    var userData = caller.loadUserData();
    if (!userData) {
        throw new errors_1.InvalidStateError('Missing userData');
    }
    if (!userData.hubUrl) {
        userData.hubUrl = authConstants_1.BLOCKSTACK_DEFAULT_GAIA_HUB_URL;
    }
    return connectToGaiaHub(userData.hubUrl, userData.appPrivateKey, userData.associationToken)
        .then(function (gaiaConfig) {
        userData.gaiaHubConfig = gaiaConfig;
        return gaiaConfig;
    });
}
exports.setLocalGaiaHubConnection = setLocalGaiaHubConnection;
function getOrSetLocalGaiaHubConnection(caller) {
    var userData = caller.store.getSessionData().userData;
    if (!userData) {
        throw new errors_1.InvalidStateError('Missing userData');
    }
    var hubConfig = userData.gaiaHubConfig;
    if (hubConfig) {
        return Promise.resolve(hubConfig);
    }
    return setLocalGaiaHubConnection(caller);
}
exports.getOrSetLocalGaiaHubConnection = getOrSetLocalGaiaHubConnection;
function getBucketUrl(gaiaHubUrl, appPrivateKey) {
    var challengeSigner;
    try {
        challengeSigner = bitcoinjs_lib_1.default.ECPair.fromPrivateKey(Buffer.from(appPrivateKey, 'hex'));
    }
    catch (e) {
        return Promise.reject(e);
    }
    return fetch(gaiaHubUrl + "/hub_info")
        .then(function (response) { return response.text(); })
        .then(function (responseText) { return JSON.parse(responseText); })
        .then(function (responseJSON) {
        var readURL = responseJSON.read_url_prefix;
        var address = utils_1.ecPairToAddress(challengeSigner);
        var bucketUrl = "" + readURL + address + "/";
        return bucketUrl;
    });
}
exports.getBucketUrl = getBucketUrl;
//# sourceMappingURL=hub.js.map