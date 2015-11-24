'use strict'

var KeyEncoder = require('key-encoder'),
    TokenSigner = require('jwt-js').TokenSigner,
    decodeToken = require('jwt-js').decodeToken,
    SECP256K1 = require('jwt-js').SECP256K1Client,
    uuid = require('node-uuid')

function AuthResponse(privateKey) {
    this.privateKey = privateKey
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.publicKey = SECP256K1.privateKeyToPublicKey(privateKey)
    this.tokenSigner = new TokenSigner('ES256k', privateKey)
    this.issuer = { publicKey: this.publicKey }
}

AuthResponse.prototype.setIssuer = function(issuer) {
    var newIssuer = this.issuer
    for (var attrname in issuer) {
        newIssuer[attrname] = issuer[attrname]
    }
    this.issuer = newIssuer
}

AuthResponse.prototype.setChallenge = function(challenge) {
    this.challenge = challenge
}

AuthResponse.prototype.setIssuer = function(username, publicKeychain, chainPath) {
    if (username && publicKeychain && chainPath) {
        this.issuer = {
            publicKey: this.publicKey,
            username: username,
            publicKeychain: publicKeychain,
            chainPath: chainPath
        }
    } else if (username) {
        this.issuer = {
            publicKey: this.publicKey,
            username: username
        }
    } else if (username || publicKeychain || chainPath) {
        throw 'Either all or none of the following must be provided: username, publicKeychain, chainPath'
    } else {
        throw 'Cannot set issuer without the following: username, publicKeychain, chainPath'
    }
}

AuthResponse.prototype.payload = function() {
    var payload = {
        issuer: this.issuer,
        issuedAt: new Date().getTime(),
        challenge: this.challenge
    }
    return payload
}

AuthResponse.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthResponse
