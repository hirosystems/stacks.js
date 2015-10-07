'use strict'

var KeyEncoder = require('key-encoder'),
    TokenSigner = require('jwt-js').TokenSigner,
    decodeToken = require('jwt-js').decodeToken,
    SECP256K1 = require('jwt-js').SECP256K1Client,
    uuid = require('node-uuid')

function AuthRequest(privateKey) {
    this.privateKey = privateKey
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.publicKey = SECP256K1.privateKeyToPublicKey(privateKey)
    this.tokenSigner = new TokenSigner('ES256k', privateKey)
}

AuthRequest.prototype.prepare = function(blockchainid, permissions, challenge) {
    if (!challenge || challenge === null) {
        challenge = uuid.v4()
    }
    this.blockchainid = blockchainid
    this.challenge = challenge
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.publicKey,
            blockchainid: this.blockchainid
        },
        issuedAt: new Date().getTime(),
        challenge: this.challenge,
        permissions: this.permissions
    }
    return payload
}

AuthRequest.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthRequest
