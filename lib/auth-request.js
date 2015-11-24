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
    this.issuer = { publicKey: this.publicKey }
    this.permissions = [
        { action: 'sign', data: uuid.v4() },
        { action: 'disclose', scope: 'username' }
    ]
}

AuthRequest.prototype.setIssuer = function(issuer) {
    var newIssuer = this.issuer
    for (var attrname in issuer) {
        newIssuer[attrname] = issuer[attrname]
    }
    this.issuer = newIssuer
}

AuthRequest.prototype.setPermissions = function(permissions) {
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: this.issuer,
        issuedAt: new Date().getTime(),
        permissions: this.permissions
    }
    return payload
}

AuthRequest.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthRequest
