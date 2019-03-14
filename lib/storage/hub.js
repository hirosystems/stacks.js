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
var bitcoinjs_lib_1 = __importDefault(require("bitcoinjs-lib"));
var crypto_1 = __importDefault(require("crypto"));
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var utils_1 = require("../utils");
var keys_1 = require("../keys");
var logger_1 = require("../logger");
exports.BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config';
function uploadToGaiaHub(filename, contents, hubConfig, contentType) {
    if (contentType === void 0) { contentType = 'application/octet-stream'; }
    return __awaiter(this, void 0, void 0, function () {
        var response, responseText, responseJSON;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.Logger.debug("uploadToGaiaHub: uploading " + filename + " to " + hubConfig.server);
                    return [4 /*yield*/, fetch(hubConfig.server + "/store/" + hubConfig.address + "/" + filename, {
                            method: 'POST',
                            headers: {
                                'Content-Type': contentType,
                                Authorization: "bearer " + hubConfig.token
                            },
                            body: contents
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Error when uploading to Gaia hub');
                    }
                    return [4 /*yield*/, response.text()];
                case 2:
                    responseText = _a.sent();
                    responseJSON = JSON.parse(responseText);
                    return [2 /*return*/, responseJSON.publicURL];
            }
        });
    });
}
exports.uploadToGaiaHub = uploadToGaiaHub;
function getFullReadUrl(filename, hubConfig) {
    return Promise.resolve("" + hubConfig.url_prefix + hubConfig.address + "/" + filename);
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
        var signer = utils_1.hexStringToECPair(signerKeyHex
            + (signerKeyHex.length === 64 ? '01' : ''));
        var digest = bitcoinjs_lib_1.default.crypto.sha256(Buffer.from(challengeText));
        var signatureBuffer = signer.sign(digest);
        var signatureWithHash = bitcoinjs_lib_1.default.script.signature.encode(signatureBuffer, bitcoinjs_lib_1.default.Transaction.SIGHASH_NONE);
        // We only want the DER encoding so remove the sighash version byte at the end.
        // See: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1241#issuecomment-428062912
        var signature = signatureWithHash.toString('hex').slice(0, -2);
        var publickey = keys_1.getPublicKeyFromPrivate(signerKeyHex);
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
    var iss = keys_1.getPublicKeyFromPrivate(signerKeyHex);
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
    return __awaiter(this, void 0, void 0, function () {
        var response, hubInfo, readURL, token, address;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger_1.Logger.debug("connectToGaiaHub: " + gaiaHubUrl + "/hub_info");
                    return [4 /*yield*/, fetch(gaiaHubUrl + "/hub_info")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    hubInfo = _a.sent();
                    readURL = hubInfo.read_url_prefix;
                    token = makeV1GaiaAuthToken(hubInfo, challengeSignerHex, gaiaHubUrl, associationToken);
                    address = utils_1.ecPairToAddress(utils_1.hexStringToECPair(challengeSignerHex
                        + (challengeSignerHex.length === 64 ? '01' : '')));
                    return [2 /*return*/, {
                            url_prefix: readURL,
                            address: address,
                            token: token,
                            server: gaiaHubUrl
                        }];
            }
        });
    });
}
exports.connectToGaiaHub = connectToGaiaHub;
function getBucketUrl(gaiaHubUrl, appPrivateKey) {
    return __awaiter(this, void 0, void 0, function () {
        var challengeSigner, response, responseText, responseJSON, readURL, address, bucketUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    challengeSigner = bitcoinjs_lib_1.default.ECPair.fromPrivateKey(Buffer.from(appPrivateKey, 'hex'));
                    return [4 /*yield*/, fetch(gaiaHubUrl + "/hub_info")];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.text()];
                case 2:
                    responseText = _a.sent();
                    responseJSON = JSON.parse(responseText);
                    readURL = responseJSON.read_url_prefix;
                    address = utils_1.ecPairToAddress(challengeSigner);
                    bucketUrl = "" + readURL + address + "/";
                    return [2 /*return*/, bucketUrl];
            }
        });
    });
}
exports.getBucketUrl = getBucketUrl;
//# sourceMappingURL=hub.js.map