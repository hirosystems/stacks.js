"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var dids_1 = require("../dids");
var keys_1 = require("../keys");
var utils_1 = require("../utils");
var authProvider_1 = require("./authProvider");
/**
 * Checks if the ES256k signature on passed `token` match the claimed public key
 * in the payload key `public_keys`.
 *
 * @param  {String} token encoded and signed authentication token
 * @return {Boolean} Returns `true` if the signature matches the claimed public key
 * @throws {Error} if `token` contains multiple public keys
 * @private
 * @ignore
 */
function doSignaturesMatchPublicKeys(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    var publicKeys = payload.public_keys;
    if (publicKeys.length === 1) {
        var publicKey = publicKeys[0];
        try {
            var tokenVerifier = new jsontokens_1.TokenVerifier('ES256k', publicKey);
            var signatureVerified = tokenVerifier.verify(token);
            if (signatureVerified) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (e) {
            return false;
        }
    }
    else {
        throw new Error('Multiple public keys are not supported');
    }
}
exports.doSignaturesMatchPublicKeys = doSignaturesMatchPublicKeys;
/**
 * Makes sure that the identity address portion of
 * the decentralized identifier passed in the issuer `iss`
 * key of the token matches the public key
 *
 * @param  {String} token encoded and signed authentication token
 * @return {Boolean} if the identity address and public keys match
 * @throws {Error} if ` token` has multiple public keys
 * @private
 * @ignore
 */
function doPublicKeysMatchIssuer(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    var publicKeys = payload.public_keys;
    var addressFromIssuer = dids_1.getAddressFromDID(payload.iss);
    if (publicKeys.length === 1) {
        var addressFromPublicKeys = keys_1.publicKeyToAddress(publicKeys[0]);
        if (addressFromPublicKeys === addressFromIssuer) {
            return true;
        }
    }
    else {
        throw new Error('Multiple public keys are not supported');
    }
    return false;
}
exports.doPublicKeysMatchIssuer = doPublicKeysMatchIssuer;
/**
 * Looks up the identity address that owns the claimed username
 * in `token` using the lookup endpoint provided in `nameLookupURL`
 * to determine if the username is owned by the identity address
 * that matches the claimed public key
 *
 * @param  {String} token  encoded and signed authentication token
 * @param  {String} nameLookupURL a URL to the name lookup endpoint of the Blockstack Core API
 * @return {Promise<Boolean>} returns a `Promise` that resolves to
 * `true` if the username is owned by the public key, otherwise the
 * `Promise` resolves to `false`
 * @private
 * @ignore
 */
function doPublicKeysMatchUsername(token, nameLookupURL) {
    return Promise.resolve().then(function () {
        var payload = jsontokens_1.decodeToken(token).payload;
        if (!payload.username) {
            return true;
        }
        if (payload.username === null) {
            return true;
        }
        if (nameLookupURL === null) {
            return false;
        }
        var username = payload.username;
        var url = nameLookupURL.replace(/\/$/, '') + "/" + username;
        return fetch(url)
            .then(function (response) { return response.text(); })
            .then(function (responseText) {
            var responseJSON = JSON.parse(responseText);
            if (responseJSON.hasOwnProperty('address')) {
                var nameOwningAddress = responseJSON.address;
                var addressFromIssuer = dids_1.getAddressFromDID(payload.iss);
                if (nameOwningAddress === addressFromIssuer) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        });
    }).catch(function () { return false; });
}
exports.doPublicKeysMatchUsername = doPublicKeysMatchUsername;
/**
 * Checks if the if the token issuance time and date is after the
 * current time and date.
 *
 * @param  {String}  token encoded and signed authentication token
 * @return {Boolean} `true` if the token was issued after the current time,
 * otherwise returns `false`
 * @private
 * @ignore
 */
function isIssuanceDateValid(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    if (payload.iat) {
        if (typeof payload.iat !== 'number') {
            return false;
        }
        var issuedAt = new Date(payload.iat * 1000); // JWT times are in seconds
        if (new Date().getTime() < issuedAt.getTime()) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return true;
    }
}
exports.isIssuanceDateValid = isIssuanceDateValid;
/**
 * Checks if the expiration date of the `token` is before the current time
 * @param  {String}  token encoded and signed authentication token
 * @return {Boolean} `true` if the `token` has not yet expired, `false`
 * if the `token` has expired
 *
 * @private
 * @ignore
 */
function isExpirationDateValid(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    if (payload.exp) {
        if (typeof payload.exp !== 'number') {
            return false;
        }
        var expiresAt = new Date(payload.exp * 1000); // JWT times are in seconds
        if (new Date().getTime() > expiresAt.getTime()) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return true;
    }
}
exports.isExpirationDateValid = isExpirationDateValid;
/**
 * Makes sure the `manifest_uri` is a same origin absolute URL.
 * @param  {String}  token encoded and signed authentication token
 * @return {Boolean} `true` if valid, otherwise `false`
 * @private
 * @ignore
 */
function isManifestUriValid(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    return utils_1.isSameOriginAbsoluteUrl(payload.domain_name, payload.manifest_uri);
}
exports.isManifestUriValid = isManifestUriValid;
/**
 * Makes sure the `redirect_uri` is a same origin absolute URL.
 * @param  {String}  token encoded and signed authentication token
 * @return {Boolean} `true` if valid, otherwise `false`
 * @private
 * @ignore
 */
function isRedirectUriValid(token) {
    var payload = jsontokens_1.decodeToken(token).payload;
    return utils_1.isSameOriginAbsoluteUrl(payload.domain_name, payload.redirect_uri);
}
exports.isRedirectUriValid = isRedirectUriValid;
/**
 * Verify authentication request is valid. This function performs a number
 * of checks on the authentication request token:
 * * Checks that `token` has a valid issuance date & is not expired
 * * Checks that `token` has a valid signature that matches the public key it claims
 * * Checks that both the manifest and redirect URLs are absolute and conform to
 * the same origin policy
 *
 * @param  {String} token encoded and signed authentication request token
 * @return {Promise} that resolves to true if the auth request
 *  is valid and false if it does not. It rejects with a String if the
 *  token is not signed
 * @private
 * @ignore
 */
function verifyAuthRequest(token) {
    return Promise.resolve().then(function () {
        if (jsontokens_1.decodeToken(token).header.alg === 'none') {
            throw new Error('Token must be signed in order to be verified');
        }
    }).then(function () { return Promise.all([
        isExpirationDateValid(token),
        isIssuanceDateValid(token),
        doSignaturesMatchPublicKeys(token),
        doPublicKeysMatchIssuer(token),
        isManifestUriValid(token),
        isRedirectUriValid(token)
    ]); }).then(function (values) {
        if (values.every(Boolean)) {
            return true;
        }
        else {
            return false;
        }
    });
}
exports.verifyAuthRequest = verifyAuthRequest;
/**
 * Verify the authentication request is valid and
 * fetch the app manifest file if valid. Otherwise, reject the promise.
 * @param  {String} token encoded and signed authentication request token
 * @return {Promise} that resolves to the app manifest file in JSON format
 * or rejects if the auth request or app manifest file is invalid
 * @private
 * @ignore
 */
function verifyAuthRequestAndLoadManifest(token) {
    return Promise.resolve().then(function () { return verifyAuthRequest(token)
        .then(function (valid) {
        if (valid) {
            return authProvider_1.fetchAppManifest(token);
        }
        else {
            return Promise.reject();
        }
    }); });
}
exports.verifyAuthRequestAndLoadManifest = verifyAuthRequestAndLoadManifest;
/**
 * Verify the authentication response is valid
 * @param {String} token the authentication response token
 * @param {String} nameLookupURL the url use to verify owner of a username
 * @return {Promise} that resolves to true if auth response
 * is valid and false if it does not
 * @private
 * @ignore
 */
function verifyAuthResponse(token, nameLookupURL) {
    return Promise.all([
        isExpirationDateValid(token),
        isIssuanceDateValid(token),
        doSignaturesMatchPublicKeys(token),
        doPublicKeysMatchIssuer(token),
        doPublicKeysMatchUsername(token, nameLookupURL)
    ]).then(function (values) {
        if (values.every(Boolean)) {
            return true;
        }
        else {
            return false;
        }
    });
}
exports.verifyAuthResponse = verifyAuthResponse;
//# sourceMappingURL=authVerification.js.map