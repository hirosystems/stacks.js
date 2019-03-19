"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("cross-fetch/polyfill");
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var index_1 = require("../index");
var ec_1 = require("../encryption/ec");
var logger_1 = require("../logger");
var authConstants_1 = require("./authConstants");
var userSession_1 = require("./userSession");
var VERSION = '1.3.1';
/**
 * Generates a ECDSA keypair to
 * use as the ephemeral app transit private key
 * @param {SessionData} session - session object in which key will be stored
 * @return {String} the hex encoded private key
 * @private
 */
function generateTransitKey() {
    var transitKey = index_1.makeECPrivateKey();
    return transitKey;
}
exports.generateTransitKey = generateTransitKey;
/**
 * Generates an authentication request that can be sent to the Blockstack
 * browser for the user to approve sign in. This authentication request can
 * then be used for sign in by passing it to the `redirectToSignInWithAuthRequest`
 * method.
 *
 * *Note: This method should only be used if you want to roll your own authentication
 * flow. Typically you'd use `redirectToSignIn` which takes care of this
 * under the hood.*
 *
 * @param  {String} transitPrivateKey - hex encoded transit private key
 * @param {String} redirectURI - location to redirect user to after sign in approval
 * @param {String} manifestURI - location of this app's manifest file
 * @param {Array<String>} scopes - the permissions this app is requesting
 * @param {String} appDomain - the origin of this app
 * @param {Number} expiresAt - the time at which this request is no longer valid
 * @param {Object} extraParams - Any extra parameters you'd like to pass to the authenticator.
 * Use this to pass options that aren't part of the Blockstack auth spec, but might be supported
 * by special authenticators.
 * @return {String} the authentication request
 */
function makeAuthRequest(transitPrivateKey, redirectURI, manifestURI, scopes, appDomain, expiresAt, extraParams) {
    if (scopes === void 0) { scopes = authConstants_1.DEFAULT_SCOPE; }
    if (expiresAt === void 0) { expiresAt = index_1.nextMonth().getTime(); }
    if (extraParams === void 0) { extraParams = {}; }
    if (!transitPrivateKey) {
        transitPrivateKey = new userSession_1.UserSession().generateAndStoreTransitKey();
    }
    var getWindowOrigin = function (paramName) {
        var origin = typeof window !== 'undefined' && window.location && window.location.origin;
        if (!origin) {
            var errMsg = "`makeAuthRequest` called without the `" + paramName + "` param specified but"
                + ' the default value uses `window.location.origin` which is not available in this environment';
            logger_1.Logger.error(errMsg);
            throw new Error(errMsg);
        }
        return origin;
    };
    if (!redirectURI) {
        redirectURI = getWindowOrigin('redirectURI') + "/";
    }
    if (!manifestURI) {
        manifestURI = getWindowOrigin('manifestURI') + "/manifest.json";
    }
    if (!appDomain) {
        appDomain = getWindowOrigin('appDomain');
    }
    /* Create the payload */
    var payload = Object.assign({}, extraParams, {
        jti: index_1.makeUUID4(),
        iat: Math.floor(new Date().getTime() / 1000),
        exp: Math.floor(expiresAt / 1000),
        iss: null,
        public_keys: [],
        domain_name: appDomain,
        manifest_uri: manifestURI,
        redirect_uri: redirectURI,
        version: VERSION,
        do_not_include_profile: true,
        supports_hub_url: true,
        scopes: scopes
    });
    logger_1.Logger.info("blockstack.js: generating v" + VERSION + " auth request");
    /* Convert the private key to a public key to an issuer */
    var publicKey = jsontokens_1.SECP256K1Client.derivePublicKey(transitPrivateKey);
    payload.public_keys = [publicKey];
    var address = index_1.publicKeyToAddress(publicKey);
    payload.iss = index_1.makeDIDFromAddress(address);
    /* Sign and return the token */
    var tokenSigner = new jsontokens_1.TokenSigner('ES256k', transitPrivateKey);
    var token = tokenSigner.sign(payload);
    return token;
}
exports.makeAuthRequest = makeAuthRequest;
/**
 * Encrypts the private key for decryption by the given
 * public key.
 * @param  {String} publicKey  [description]
 * @param  {String} privateKey [description]
 * @return {String} hex encoded ciphertext
 * @private
 */
function encryptPrivateKey(publicKey, privateKey) {
    var encryptedObj = ec_1.encryptECIES(publicKey, privateKey);
    var encryptedJSON = JSON.stringify(encryptedObj);
    return (Buffer.from(encryptedJSON)).toString('hex');
}
exports.encryptPrivateKey = encryptPrivateKey;
/**
 * Decrypts the hex encrypted private key
 * @param  {String} privateKey  the private key corresponding to the public
 * key for which the ciphertext was encrypted
 * @param  {String} hexedEncrypted the ciphertext
 * @return {String}  the decrypted private key
 * @throws {Error} if unable to decrypt
 *
 * @private
 */
function decryptPrivateKey(privateKey, hexedEncrypted) {
    var unhexedString = Buffer.from(hexedEncrypted, 'hex').toString();
    var encryptedObj = JSON.parse(unhexedString);
    var decrypted = ec_1.decryptECIES(privateKey, encryptedObj);
    if (typeof decrypted !== 'string') {
        throw new Error('Unable to correctly decrypt private key');
    }
    else {
        return decrypted;
    }
}
exports.decryptPrivateKey = decryptPrivateKey;
/**
 * Generates a signed authentication response token for an app. This
 * token is sent back to apps which use contents to access the
 * resources and data requested by the app.
 *
 * @param  {String} privateKey the identity key of the Blockstack ID generating
 * the authentication response
 * @param  {Object} profile the profile object for the Blockstack ID
 * @param  {String} username the username of the Blockstack ID if any, otherwise `null`
 * @param  {AuthMetadata} metadata an object containing metadata sent as part of the authentication
 * response including `email` if requested and available and a URL to the profile
 * @param  {String} coreToken core session token when responding to a legacy auth request
 * or `null` for current direct to gaia authentication requests
 * @param  {String} appPrivateKey the application private key. This private key is
 * unique and specific for every Blockstack ID and application combination.
 * @param  {Number} expiresAt an integer in the same format as
 * `new Date().getTime()`, milliseconds since the Unix epoch
 * @param {String} transitPublicKey the public key provide by the app
 * in its authentication request with which secrets will be encrypted
 * @param {String} hubUrl URL to the write path of the user's Gaia hub
 * @param {String} blockstackAPIUrl URL to the API endpoint to use
 * @param {String} associationToken JWT that binds the app key to the identity key
 * @return {String} signed and encoded authentication response token
 * @private
 */
function makeAuthResponse(privateKey, profile, username, metadata, coreToken, appPrivateKey, expiresAt, transitPublicKey, hubUrl, blockstackAPIUrl, associationToken) {
    if (profile === void 0) { profile = {}; }
    if (username === void 0) { username = null; }
    if (coreToken === void 0) { coreToken = null; }
    if (appPrivateKey === void 0) { appPrivateKey = null; }
    if (expiresAt === void 0) { expiresAt = index_1.nextMonth().getTime(); }
    if (transitPublicKey === void 0) { transitPublicKey = null; }
    if (hubUrl === void 0) { hubUrl = null; }
    if (blockstackAPIUrl === void 0) { blockstackAPIUrl = null; }
    if (associationToken === void 0) { associationToken = null; }
    /* Convert the private key to a public key to an issuer */
    var publicKey = jsontokens_1.SECP256K1Client.derivePublicKey(privateKey);
    var address = index_1.publicKeyToAddress(publicKey);
    /* See if we should encrypt with the transit key */
    var privateKeyPayload = appPrivateKey;
    var coreTokenPayload = coreToken;
    var additionalProperties = {};
    if (appPrivateKey !== undefined && appPrivateKey !== null) {
        logger_1.Logger.info("blockstack.js: generating v" + VERSION + " auth response");
        if (transitPublicKey !== undefined && transitPublicKey !== null) {
            privateKeyPayload = encryptPrivateKey(transitPublicKey, appPrivateKey);
            if (coreToken !== undefined && coreToken !== null) {
                coreTokenPayload = encryptPrivateKey(transitPublicKey, coreToken);
            }
        }
        additionalProperties = {
            email: metadata.email ? metadata.email : null,
            profile_url: metadata.profileUrl ? metadata.profileUrl : null,
            hubUrl: hubUrl,
            blockstackAPIUrl: blockstackAPIUrl,
            associationToken: associationToken,
            version: VERSION
        };
    }
    else {
        logger_1.Logger.info('blockstack.js: generating legacy auth response');
    }
    /* Create the payload */
    var payload = Object.assign({}, {
        jti: index_1.makeUUID4(),
        iat: Math.floor(new Date().getTime() / 1000),
        exp: Math.floor(expiresAt / 1000),
        iss: index_1.makeDIDFromAddress(address),
        private_key: privateKeyPayload,
        public_keys: [publicKey],
        profile: profile,
        username: username,
        core_token: coreTokenPayload
    }, additionalProperties);
    /* Sign and return the token */
    var tokenSigner = new jsontokens_1.TokenSigner('ES256k', privateKey);
    return tokenSigner.sign(payload);
}
exports.makeAuthResponse = makeAuthResponse;
//# sourceMappingURL=authMessages.js.map