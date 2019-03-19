"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var query_string_1 = __importDefault(require("query-string"));
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var index_1 = require("../index");
var utils_1 = require("../utils");
var logger_1 = require("../logger");
/**
 * Retrieves the authentication request from the query string
 * @return {String|null} the authentication request or `null` if
 * the query string parameter `authRequest` is not found
 * @private
 */
function getAuthRequestFromURL() {
    utils_1.checkWindowAPI('getAuthRequestFromURL', 'location');
    var queryDict = query_string_1.default.parse(window.location.search);
    if (queryDict.authRequest) {
        return queryDict.authRequest.split(utils_1.BLOCKSTACK_HANDLER + ":").join('');
    }
    else {
        return null;
    }
}
exports.getAuthRequestFromURL = getAuthRequestFromURL;
/**
 * Fetches the contents of the manifest file specified in the authentication request
 *
 * @param  {String} authRequest encoded and signed authentication request
 * @return {Promise<Object|String>} Returns a `Promise` that resolves to the JSON
 * object manifest file unless there's an error in which case rejects with an error
 * message.
 * @private
 */
function fetchAppManifest(authRequest) {
    return new Promise(function (resolve, reject) {
        if (!authRequest) {
            reject('Invalid auth request');
        }
        else {
            var payload = jsontokens_1.decodeToken(authRequest).payload;
            var manifestURI = payload.manifest_uri;
            try {
                logger_1.Logger.debug("Fetching manifest from " + manifestURI);
                fetch(manifestURI)
                    .then(function (response) { return response.text(); })
                    .then(function (responseText) { return JSON.parse(responseText); })
                    .then(function (responseJSON) {
                    resolve(responseJSON);
                })
                    .catch(function (e) {
                    logger_1.Logger.debug(e.stack);
                    reject('Could not fetch manifest.json');
                });
            }
            catch (e) {
                logger_1.Logger.debug(e.stack);
                reject('Could not fetch manifest.json');
            }
        }
    });
}
exports.fetchAppManifest = fetchAppManifest;
/**
 * Redirect the user's browser to the app using the `redirect_uri`
 * specified in the authentication request, passing the authentication
 * response token as a query parameter.
 *
 * @param {String} authRequest  encoded and signed authentication request token
 * @param {String} authResponse encoded and signed authentication response token
 * @return {void}
 * @throws {Error} if there is no redirect uri
 * @private
 */
function redirectUserToApp(authRequest, authResponse) {
    var payload = jsontokens_1.decodeToken(authRequest).payload;
    var redirectURI = payload.redirect_uri;
    logger_1.Logger.debug(redirectURI);
    if (redirectURI) {
        redirectURI = index_1.updateQueryStringParameter(redirectURI, 'authResponse', authResponse);
    }
    else {
        throw new Error('Invalid redirect URI');
    }
    utils_1.checkWindowAPI('redirectUserToApp', 'location');
    window.location.href = redirectURI;
}
exports.redirectUserToApp = redirectUserToApp;
//# sourceMappingURL=authProvider.js.map