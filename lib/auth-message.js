'use strict'

var jwt = require('jsonwebtoken'),
    hasProperty = require('hasprop'),
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder,
    SECP256k1Parameters = require('ecdsa-key-encoder').SECP256k1Parameters

function AuthMessage() {
}

AuthMessage.prototype.signingKeyPEM = function() {
    return this.keyEncoder.hexToPrivatePEM(this.signingKey)
}

AuthMessage.prototype.token = function() {
    return jwt.sign(this.payload(), this.signingKeyPEM(), {algorithm: 'ES256'})
}

AuthMessage.prototype.decode = function() {
    return jwt.decode(this.token(), {complete: true})
}

AuthMessage.prototype.json = function() {
    return this.decode(this.token())
}

module.exports = {
    AuthMessage: AuthMessage
}