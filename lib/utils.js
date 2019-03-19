"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = __importDefault(require("url"));
var bitcoinjs_lib_1 = require("bitcoinjs-lib");
var config_1 = require("./config");
var logger_1 = require("./logger");
exports.BLOCKSTACK_HANDLER = 'blockstack';
/**
 * Time
 * @private
 */
function nextYear() {
    return new Date(new Date().setFullYear(new Date().getFullYear() + 1));
}
exports.nextYear = nextYear;
function nextMonth() {
    return new Date(new Date().setMonth(new Date().getMonth() + 1));
}
exports.nextMonth = nextMonth;
function nextHour() {
    return new Date(new Date().setHours(new Date().getHours() + 1));
}
exports.nextHour = nextHour;
/**
 * Query Strings
 * @private
 */
function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", 'i');
    var separator = uri.indexOf('?') !== -1 ? '&' : '?';
    if (uri.match(re)) {
        return uri.replace(re, "$1" + key + "=" + value + "$2");
    }
    else {
        return "" + uri + separator + key + "=" + value;
    }
}
exports.updateQueryStringParameter = updateQueryStringParameter;
/**
 * Versioning
 * @param {string} v1 - the left half of the version inequality
 * @param {string} v2 - right half of the version inequality
 * @returns {bool} iff v1 >= v2
 * @private
 */
function isLaterVersion(v1, v2) {
    if (v1 === undefined) {
        v1 = '0.0.0';
    }
    if (v2 === undefined) {
        v2 = '0.0.0';
    }
    var v1tuple = v1.split('.').map(function (x) { return parseInt(x, 10); });
    var v2tuple = v2.split('.').map(function (x) { return parseInt(x, 10); });
    for (var index = 0; index < v2.length; index++) {
        if (index >= v1.length) {
            v2tuple.push(0);
        }
        if (v1tuple[index] < v2tuple[index]) {
            return false;
        }
    }
    return true;
}
exports.isLaterVersion = isLaterVersion;
function hexStringToECPair(skHex) {
    var ecPairOptions = {
        network: config_1.config.network.layer1,
        compressed: true
    };
    if (skHex.length === 66) {
        if (skHex.slice(64) !== '01') {
            throw new Error('Improperly formatted private-key hex string. 66-length hex usually '
                + 'indicates compressed key, but last byte must be == 1');
        }
        return bitcoinjs_lib_1.ECPair.fromPrivateKey(Buffer.from(skHex.slice(0, 64), 'hex'), ecPairOptions);
    }
    else if (skHex.length === 64) {
        ecPairOptions.compressed = false;
        return bitcoinjs_lib_1.ECPair.fromPrivateKey(Buffer.from(skHex, 'hex'), ecPairOptions);
    }
    else {
        throw new Error('Improperly formatted private-key hex string: length should be 64 or 66.');
    }
}
exports.hexStringToECPair = hexStringToECPair;
function ecPairToHexString(secretKey) {
    var ecPointHex = secretKey.privateKey.toString('hex');
    if (secretKey.compressed) {
        return ecPointHex + "01";
    }
    else {
        return ecPointHex;
    }
}
exports.ecPairToHexString = ecPairToHexString;
function ecPairToAddress(keyPair) {
    return bitcoinjs_lib_1.address.toBase58Check(bitcoinjs_lib_1.crypto.hash160(keyPair.publicKey), keyPair.network.pubKeyHash);
}
exports.ecPairToAddress = ecPairToAddress;
/**
 * UUIDs
 * @private
 */
function makeUUID4() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now(); // use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
exports.makeUUID4 = makeUUID4;
/**
 * Checks if both urls pass the same origin check & are absolute
 * @param  {[type]}  uri1 first uri to check
 * @param  {[type]}  uri2 second uri to check
 * @return {Boolean} true if they pass the same origin check
 * @private
 */
function isSameOriginAbsoluteUrl(uri1, uri2) {
    var parsedUri1 = url_1.default.parse(uri1);
    var parsedUri2 = url_1.default.parse(uri2);
    var port1 = parseInt(parsedUri1.port || '0', 10) | 0 || (parsedUri1.protocol === 'https:' ? 443 : 80);
    var port2 = parseInt(parsedUri2.port || '0', 10) | 0 || (parsedUri2.protocol === 'https:' ? 443 : 80);
    var match = {
        scheme: parsedUri1.protocol === parsedUri2.protocol,
        hostname: parsedUri1.hostname === parsedUri2.hostname,
        port: port1 === port2,
        absolute: (uri1.includes('http://') || uri1.includes('https://'))
            && (uri2.includes('http://') || uri2.includes('https://'))
    };
    return match.scheme && match.hostname && match.port && match.absolute;
}
exports.isSameOriginAbsoluteUrl = isSameOriginAbsoluteUrl;
/**
 * Runtime check for the existence of the global `window` object and the
 * given API key (name) on `window`. Throws an error if either are not
 * available in the current environment.
 * @param fnDesc The function name to include in the thrown error and log.
 * @param name The name of the key on the `window` object to check for.
 * @hidden
 */
function checkWindowAPI(fnDesc, name) {
    var api = typeof window !== 'undefined' && window[name];
    if (!api) {
        var errMsg = "`" + fnDesc + "` uses the `window." + name + "` API which is "
            + ' not available in the current environment.';
        logger_1.Logger.error(errMsg);
        throw new Error(errMsg);
    }
}
exports.checkWindowAPI = checkWindowAPI;
//# sourceMappingURL=utils.js.map