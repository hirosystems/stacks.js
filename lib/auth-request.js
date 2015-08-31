'use strict'

var AuthMessage = require('./auth-message').AuthMessage,
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder

function doDomainAndPublicKeyMatch(domain, publicKey, resolver) {
    return true
}

AuthRequest.prototype = new AuthMessage()
AuthRequest.prototype.constructor = AuthRequest
AuthRequest.decode = AuthMessage.decode
AuthRequest.isValidJWT = AuthMessage.isValidJWT
AuthRequest.getPublicKeyPEM = AuthMessage.getPublicKeyPEM
AuthRequest.verify = AuthMessage.verify

function AuthRequest(signingKey, verifyingKey, issuingDomain, permissions) {
    this.keyEncoder = new KeyEncoder(SECP256k1Parameters)

    this.signingKey = signingKey
    this.verifyingKey = verifyingKey
    this.issuingDomain = issuingDomain
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.verifyingKey,
            domain: this.issuingDomain
        },
        issuedAt: new Date().getTime(),
        challenge: this.challenge,
        permissions: this.permissions
    }
    return payload
}

AuthRequest.hasValidIssuer = function(decodedToken, resolver, resolve, reject) {
    if (!hasProperty(decodedToken, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    if (!hasProperty(decodedToken, 'issuer.domain')) {
        reject('token must have a domain')
    }

    var domain = decodedToken.issuer.domain,
        publicKey = decodedToken.issuer.publicKey

    var domainAndPublicKeyMatch = doDomainAndPublicKeyMatch(domain, publicKey, resolver)

    return false
}

module.exports = {
    AuthRequest: AuthRequest
}