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
}

AuthResponse.prototype.prepare = function(challenge, blockchainid, publicKeychain, chainPath) {
    this.challenge = challenge
    if (blockchainid && publicKeychain && chainPath) {
        this.blockchainid = blockchainid
        this.publicKeychain = publicKeychain
        this.chainPath = chainPath
    } else if (blockchainid || publicKeychain || chainPath) {
        throw 'Either all or none of the following must be provided: blockchainid, publicKeychain, chainPath'
    }
}

AuthResponse.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.publicKey
        },
        issuedAt: new Date().getTime(),
        challenge: this.challenge
    }

    if (this.blockchainid && this.publicKeychain && this.chainPath) {
        payload['issuer'] = {
            publicKey: this.publicKey,
            blockchainid: this.blockchainid,
            publicKeychain: this.publicKeychain,
            chainPath: this.chainPath
        }
    }

    return payload
}

AuthResponse.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthResponse
