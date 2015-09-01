'use strict'

var AuthMessage = require('./auth-message').AuthMessage,
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder,
    hasProperty = require('hasprop'),
    jwt = require('jsonwebtoken'),
    AuthVerifier = require('./auth-verifier').AuthVerifier

AuthRequest.prototype = new AuthMessage()
AuthRequest.prototype.constructor = AuthRequest

function AuthRequest(signingKey, verifyingKey, issuingDomain, permissions) {
    this.keyEncoder = new KeyEncoder(SECP256k1Parameters)

    this.signingKey = signingKey
    this.verifyingKey = verifyingKey
    this.issuingDomain = issuingDomain
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.verifyingKey,
            domain: this.issuingDomain
        },
        issuedAt: new Date().getTime(),
        challenge: this.challenge,
        permissions: this.permissions
    }
    return payload
}

AuthRequest.decode = function(token) {
    return jwt.decode(token, {complete: true})
}

AuthRequest.verify = function(token, resolver, callbackFunction) {
    var authVerifier = new AuthVerifier(resolver)
    authVerifier.verifyRequest(token, callbackFunction)
}

module.exports = {
    AuthRequest: AuthRequest
}