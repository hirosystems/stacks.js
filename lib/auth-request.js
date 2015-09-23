'use strict'

var KeyEncoder = require('key-encoder'),
    AuthMessage = require('./auth-message'),
    AuthVerifier = require('./auth-verifier'),
    Tokenizer = require('jwt-js').Tokenizer

AuthRequest.prototype = new AuthMessage()
AuthRequest.prototype.constructor = AuthRequest

function AuthRequest(privateKey, publicKey, issuingDomain, permissions) {
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.tokenizer = new Tokenizer('ES256k')

    this.privateKey = privateKey
    this.publicKey = publicKey
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
    var tokenizer = new Tokenizer('ES256k')
    return tokenizer.decode(token)
}

AuthRequest.verify = function(token, resolver, callbackFunction) {
    var authVerifier = new AuthVerifier(resolver)
    authVerifier.verifyRequest(token, callbackFunction)
}

module.exports = AuthRequest