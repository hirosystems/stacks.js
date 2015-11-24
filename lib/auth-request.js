'use strict'

var KeyEncoder = require('key-encoder'),
    TokenSigner = require('jwt-js').TokenSigner,
    decodeToken = require('jwt-js').decodeToken,
    secp256k1 = require('elliptic-curve').secp256k1,
    uuid = require('node-uuid')

function AuthRequest(privateKey) {
    this.privateKey = privateKey
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.publicKey = secp256k1.getPublicKey(privateKey)
    this.tokenSigner = new TokenSigner('ES256k', privateKey)
    this.issuer = { publicKey: this.publicKey }
    this.provisions = [
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

AuthRequest.prototype.setProvisions = function(provisions) {
    this.provisions = provisions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: this.issuer,
        issuedAt: new Date().getTime(),
        provisions: this.provisions
    }
    return payload
}

AuthRequest.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthRequest
