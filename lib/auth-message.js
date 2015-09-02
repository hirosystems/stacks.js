'use strict'

var jwt = require('jsonwebtoken'),
    hasProperty = require('hasprop'),
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder,
    SECP256k1Parameters = require('ecdsa-key-encoder').SECP256k1Parameters,
    decompressPublicKey = require('./utils').decompressPublicKey

function AuthMessage() {
}

AuthMessage.prototype.signingKeyPEM = function() {
    var publicKey = decompressPublicKey(this.publicKey)
    return this.keyEncoder.hexToPrivatePEM(this.privateKey, publicKey)
}

AuthMessage.prototype.token = function() {
    var signingKeyPEM = this.signingKeyPEM()
    return jwt.sign(this.payload(), signingKeyPEM, {algorithm: 'ES256'})
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