"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
require("cross-fetch/polyfill");
/**
 * Create an authentication token to be sent to the Core API server
 * in order to generate a Core session JWT.
 *
 * @param {String} appDomain  The unique application identifier (e.g. foo.app, www.foo.com, etc).
 * @param {Array} appMethods  The list of API methods this application will need.
 * @param {String} appPrivateKey  The application-specific private key
 * @param {String|null} blockchainID  This is the blockchain ID of the requester
 * @param {String} thisDevice Identifier of the current device
 *
 * @return {String} a JWT signed by the app's private key
 * @deprecated
 * @private
 */
function makeCoreSessionRequest(appDomain, appMethods, appPrivateKey, blockchainID, thisDevice) {
    if (blockchainID === void 0) { blockchainID = null; }
    if (thisDevice === void 0) { thisDevice = null; }
    if (thisDevice === null) {
        thisDevice = '.default';
    }
    var appPublicKey = jsontokens_1.SECP256K1Client.derivePublicKey(appPrivateKey);
    var appPublicKeys = [{
            public_key: appPublicKey,
            device_id: thisDevice
        }];
    var authBody = {
        version: 1,
        blockchain_id: blockchainID,
        app_private_key: appPrivateKey,
        app_domain: appDomain,
        methods: appMethods,
        app_public_keys: appPublicKeys,
        device_id: thisDevice
    };
    // make token
    var tokenSigner = new jsontokens_1.TokenSigner('ES256k', appPrivateKey);
    var token = tokenSigner.sign(authBody);
    return token;
}
exports.makeCoreSessionRequest = makeCoreSessionRequest;
/**
 * Send Core a request for a session token.
 *
 * @param {String} coreHost host name of the core node
 * @param {Number} corePort port number of the core node
 * @param {String} coreAuthRequest  a signed JWT encoding the authentication request
 * @param {String} apiPassword the API password for Core
 *
 * @return {Promise} the resolves to a JWT signed with the Core API server's private key
 * that authorizes the bearer to carry out the requested operations and rejects
 * with an error message otherwise
 * @deprecated
 * @private
 */
function sendCoreSessionRequest(coreHost, corePort, coreAuthRequest, apiPassword) {
    return Promise.resolve().then(function () {
        if (!apiPassword) {
            throw new Error('Missing API password');
        }
    })
        .then(function () {
        var options = {
            headers: {
                Authorization: "bearer " + apiPassword
            }
        };
        var url = "http://" + coreHost + ":" + corePort + "/v1/auth?authRequest=" + coreAuthRequest;
        return fetch(url, options);
    })
        .then(function (response) {
        if (!response.ok) {
            throw new Error('HTTP status not OK');
        }
        return response.text();
    })
        .then(function (responseText) {
        var responseJson = JSON.parse(responseText);
        var token = responseJson.token;
        if (!token) {
            throw new Error('Failed to get Core session token');
        }
        return token;
    })
        .catch(function (error) {
        console.error(error);
        throw new Error('Invalid Core response: not JSON');
    });
}
exports.sendCoreSessionRequest = sendCoreSessionRequest;
/**
 * Get a core session token.  Generate an auth request, sign it, send it to Core,
 * and get back a session token.
 *
 * @param {String} coreHost Core API server's hostname
 * @param {Number} corePort Core API server's port number
 * @param {String} apiPassword core api password
 * @param  {String} appPrivateKey Application's private key
 * @param  {String} blockchainId blockchain ID of the user signing in.
 * `null` if user has no blockchain ID
 * @param {String} authRequest authentication request token
 * @param {String} deviceId identifier for the current device
 *
 * @return {Promise} a Promise that resolves to a Core session token or rejects
 * with an error message.
 * @deprecated
 * @private
 */
function getCoreSession(coreHost, corePort, apiPassword, appPrivateKey, blockchainId, authRequest, deviceId) {
    if (blockchainId === void 0) { blockchainId = null; }
    if (authRequest === void 0) { authRequest = null; }
    if (deviceId === void 0) { deviceId = '0'; }
    if (!authRequest) {
        return Promise.reject('No authRequest provided');
    }
    var payload = null;
    var authRequestObject = null;
    try {
        authRequestObject = jsontokens_1.decodeToken(authRequest);
        if (!authRequestObject) {
            return Promise.reject('Invalid authRequest in URL query string');
        }
        if (!authRequestObject.payload) {
            return Promise.reject('Invalid authRequest in URL query string');
        }
        payload = authRequestObject.payload;
    }
    catch (e) {
        console.error(e.stack);
        return Promise.reject('Failed to parse authRequest in URL');
    }
    var appDomain = payload.domain_name;
    if (!appDomain) {
        return Promise.reject('No domain_name in authRequest');
    }
    var appMethods = payload.scopes;
    var coreAuthRequest = makeCoreSessionRequest(appDomain, appMethods, appPrivateKey, blockchainId, deviceId);
    return sendCoreSessionRequest(coreHost, corePort, coreAuthRequest, apiPassword);
}
exports.getCoreSession = getCoreSession;
//# sourceMappingURL=authSession.js.map