'use strict'

var KeyEncoder = require('key-encoder').KeyEncoder,
    hasProperty = require('hasprop'),
    jwt = require('jsonwebtoken'),
    AuthMessage = require('./auth-message'),
    AuthVerifier = require('./auth-verifier'),
    utils = require('./utils'),
    loadPublicKey = utils.loadPublicKey,
    loadPrivateKey = utils.loadPrivateKey

AuthRequest.prototype = new AuthMessage()
AuthRequest.prototype.constructor = AuthRequest

function AuthRequest(privateKey, publicKey, issuingDomain, permissions) {
    this.keyEncoder = new KeyEncoder(SECP256k1Parameters)
    this.privateKey = privateKey
    this.uncompressedPrivateKey = loadPrivateKey(privateKey)
    this.publicKey = publicKey
    this.uncompressedPublicKey = loadPublicKey(publicKey)
    this.issuingDomain = issuingDomain
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.publicKey,
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

module.exports = AuthRequest