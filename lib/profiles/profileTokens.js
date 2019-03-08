"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var bitcoinjs_lib_1 = require("bitcoinjs-lib");
// @ts-ignore: Could not find a declaration file for module
var jsontokens_1 = require("jsontokens");
var utils_1 = require("../utils");
/**
  * Signs a profile token
  * @param {Object} profile - the JSON of the profile to be signed
  * @param {String} privateKey - the signing private key
  * @param {Object} subject - the entity that the information is about
  * @param {Object} issuer - the entity that is issuing the token
  * @param {String} signingAlgorithm - the signing algorithm to use
  * @param {Date} issuedAt - the time of issuance of the token
  * @param {Date} expiresAt - the time of expiration of the token
  * @returns {Object} - the signed profile token
  */
function signProfileToken(profile, privateKey, subject, issuer, signingAlgorithm, issuedAt, expiresAt) {
    if (subject === void 0) { subject = null; }
    if (issuer === void 0) { issuer = null; }
    if (signingAlgorithm === void 0) { signingAlgorithm = 'ES256K'; }
    if (issuedAt === void 0) { issuedAt = new Date(); }
    if (expiresAt === void 0) { expiresAt = utils_1.nextYear(); }
    if (signingAlgorithm !== 'ES256K') {
        throw new Error('Signing algorithm not supported');
    }
    var publicKey = jsontokens_1.SECP256K1Client.derivePublicKey(privateKey);
    if (subject === null) {
        subject = { publicKey: publicKey };
    }
    if (issuer === null) {
        issuer = { publicKey: publicKey };
    }
    var tokenSigner = new jsontokens_1.TokenSigner(signingAlgorithm, privateKey);
    var payload = {
        jti: utils_1.makeUUID4(),
        iat: issuedAt.toISOString(),
        exp: expiresAt.toISOString(),
        subject: subject,
        issuer: issuer,
        claim: profile
    };
    return tokenSigner.sign(payload);
}
exports.signProfileToken = signProfileToken;
/**
  * Wraps a token for a profile token file
  * @param {String} token - the token to be wrapped
  * @returns {Object} - including `token` and `decodedToken`
  */
function wrapProfileToken(token) {
    return {
        token: token,
        decodedToken: jsontokens_1.decodeToken(token)
    };
}
exports.wrapProfileToken = wrapProfileToken;
/**
  * Verifies a profile token
  * @param {String} token - the token to be verified
  * @param {String} publicKeyOrAddress - the public key or address of the
  *   keypair that is thought to have signed the token
  * @returns {Object} - the verified, decoded profile token
  * @throws {Error} - throws an error if token verification fails
  */
function verifyProfileToken(token, publicKeyOrAddress) {
    var decodedToken = jsontokens_1.decodeToken(token);
    var payload = decodedToken.payload;
    // Inspect and verify the subject
    if (payload.hasOwnProperty('subject')) {
        if (!payload.subject.hasOwnProperty('publicKey')) {
            throw new Error('Token doesn\'t have a subject public key');
        }
    }
    else {
        throw new Error('Token doesn\'t have a subject');
    }
    // Inspect and verify the issuer
    if (payload.hasOwnProperty('issuer')) {
        if (!payload.issuer.hasOwnProperty('publicKey')) {
            throw new Error('Token doesn\'t have an issuer public key');
        }
    }
    else {
        throw new Error('Token doesn\'t have an issuer');
    }
    // Inspect and verify the claim
    if (!payload.hasOwnProperty('claim')) {
        throw new Error('Token doesn\'t have a claim');
    }
    var issuerPublicKey = payload.issuer.publicKey;
    var publicKeyBuffer = Buffer.from(issuerPublicKey, 'hex');
    var compressedKeyPair = bitcoinjs_lib_1.ECPair.fromPublicKey(publicKeyBuffer, { compressed: true });
    var compressedAddress = utils_1.ecPairToAddress(compressedKeyPair);
    var uncompressedKeyPair = bitcoinjs_lib_1.ECPair.fromPublicKey(publicKeyBuffer, { compressed: false });
    var uncompressedAddress = utils_1.ecPairToAddress(uncompressedKeyPair);
    if (publicKeyOrAddress === issuerPublicKey) {
        // pass
    }
    else if (publicKeyOrAddress === compressedAddress) {
        // pass
    }
    else if (publicKeyOrAddress === uncompressedAddress) {
        // pass
    }
    else {
        throw new Error('Token issuer public key does not match the verifying value');
    }
    var tokenVerifier = new jsontokens_1.TokenVerifier(decodedToken.header.alg, issuerPublicKey);
    if (!tokenVerifier) {
        throw new Error('Invalid token verifier');
    }
    var tokenVerified = tokenVerifier.verify(token);
    if (!tokenVerified) {
        throw new Error('Token verification failed');
    }
    return decodedToken;
}
exports.verifyProfileToken = verifyProfileToken;
/**
  * Extracts a profile from an encoded token and optionally verifies it,
  * if `publicKeyOrAddress` is provided.
  * @param {String} token - the token to be extracted
  * @param {String} publicKeyOrAddress - the public key or address of the
  *   keypair that is thought to have signed the token
  * @returns {Object} - the profile extracted from the encoded token
  * @throws {Error} - if the token isn't signed by the provided `publicKeyOrAddress`
  */
function extractProfile(token, publicKeyOrAddress) {
    if (publicKeyOrAddress === void 0) { publicKeyOrAddress = null; }
    var decodedToken;
    if (publicKeyOrAddress) {
        decodedToken = verifyProfileToken(token, publicKeyOrAddress);
    }
    else {
        decodedToken = jsontokens_1.decodeToken(token);
    }
    var profile = {};
    if (decodedToken.hasOwnProperty('payload')) {
        var payload = decodedToken.payload;
        if (payload.hasOwnProperty('claim')) {
            profile = decodedToken.payload.claim;
        }
    }
    return profile;
}
exports.extractProfile = extractProfile;
//# sourceMappingURL=profileTokens.js.map