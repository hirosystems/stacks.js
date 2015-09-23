'use strict'

var KeyEncoder = require('key-encoder'),
    Tokenizer = require('jwt-js').Tokenizer,
    AuthMessage = require('./auth-message'),
    AuthVerifier = require('./auth-verifier')

AuthResponse.prototype = new AuthMessage()
AuthResponse.prototype.constructor = AuthResponse

function AuthResponse(privateKey, publicKey, challenge, blockchainid, publicKeychain, chainPath) {
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.tokenizer = new Tokenizer('ES256k')

    this.privateKey = privateKey
    this.publicKey = publicKey
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

AuthResponse.decode = function(token) {
    var tokenizer = new Tokenizer('ES256k')
    return tokenizer.decode(token, {complete: true})
}

AuthResponse.verify = function(token, resolver, callbackFunction) {
    var authVerifier = new AuthVerifier(resolver)
    authVerifier.verifyResponse(token, callbackFunction)
}

module.exports = AuthResponse
