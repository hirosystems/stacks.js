"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var query_string_1 = __importDefault(require("query-string"));
// TODO: Putting in here so it executes ASAP. There is probably a better place to put this.
// Note: This prototype is designed to work as a drop-in-replacement (non-breaking upgrade)
// for apps using blockstack.js. That requires doing this hacky global & immediate detection. 
// A more proper approach would require developers to call an additional blockstack.js method 
// for invoking this detection method.
(function protocolEchoReplyDetection() {
    // Check that the `window` APIs exist
    if (typeof window !== 'object' || !window.location || !window.localStorage) {
        // Exit detection function - we are not running in a browser environment.
        return;
    }
    // Check if the location query string contains a protocol-echo reply.
    // If so, this page was only re-opened to signal back the originating 
    // tab that the protocol handler is installed. 
    var queryDict = query_string_1.default.parse(window.location.search);
    if (queryDict.echoReply) {
        // Use localStorage to notify originated tab that protocol handler is available and working.
        var echoReplyKey = "echo-reply-" + queryDict.echoReply;
        // Set the echo-reply result in localStorage for the other window to see.
        window.localStorage.setItem(echoReplyKey, 'success');
        // Redirect back to the localhost auth url, as opposed to another protocol launch.
        // This will re-use the same tab rather than creating another useless one.
        window.setTimeout(function () {
            window.location.href = decodeURIComponent(queryDict.authContinuation);
        }, 10);
    }
}());
__export(require("./auth"));
__export(require("./profiles"));
__export(require("./storage"));
var dids_1 = require("./dids");
exports.makeDIDFromAddress = dids_1.makeDIDFromAddress;
exports.makeDIDFromPublicKey = dids_1.makeDIDFromPublicKey;
exports.getDIDType = dids_1.getDIDType;
exports.getAddressFromDID = dids_1.getAddressFromDID;
var keys_1 = require("./keys");
exports.getEntropy = keys_1.getEntropy;
exports.makeECPrivateKey = keys_1.makeECPrivateKey;
exports.publicKeyToAddress = keys_1.publicKeyToAddress;
exports.getPublicKeyFromPrivate = keys_1.getPublicKeyFromPrivate;
var utils_1 = require("./utils");
exports.nextYear = utils_1.nextYear;
exports.nextMonth = utils_1.nextMonth;
exports.nextHour = utils_1.nextHour;
exports.makeUUID4 = utils_1.makeUUID4;
exports.updateQueryStringParameter = utils_1.updateQueryStringParameter;
exports.isLaterVersion = utils_1.isLaterVersion;
exports.isSameOriginAbsoluteUrl = utils_1.isSameOriginAbsoluteUrl;
exports.hexStringToECPair = utils_1.hexStringToECPair;
exports.ecPairToHexString = utils_1.ecPairToHexString;
exports.ecPairToAddress = utils_1.ecPairToAddress;
var operations_1 = require("./operations");
exports.transactions = operations_1.transactions;
exports.safety = operations_1.safety;
exports.PubkeyHashSigner = operations_1.PubkeyHashSigner;
exports.addUTXOsToFund = operations_1.addUTXOsToFund;
exports.estimateTXBytes = operations_1.estimateTXBytes;
var wallet_1 = require("./wallet");
exports.BlockstackWallet = wallet_1.BlockstackWallet;
var network_1 = require("./network");
exports.network = network_1.network;
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
exports.decodeToken = jsontokens_1.decodeToken;
var config_1 = require("./config");
exports.config = config_1.config;
var encryption_1 = require("./encryption");
exports.encryptMnemonic = encryption_1.encryptMnemonic;
exports.decryptMnemonic = encryption_1.decryptMnemonic;
var userSession_1 = require("./auth/userSession");
exports.UserSession = userSession_1.UserSession;
//# sourceMappingURL=index.js.map