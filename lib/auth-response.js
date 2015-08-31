'use strict'

var hasProperty = require('hasprop'),
    AuthMessage = require('./auth-message').AuthMessage,
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder

function isPublicKeychainInProfile(blockchainid, publicKeychain, resolver) {
    return true
}

function doMasterAndChildKeysMatch(publicKeychain, childPublicKey, chainPath) {
    return true
}

AuthResponse.prototype = new AuthMessage()
AuthResponse.prototype.constructor = AuthResponse
AuthResponse.decode = AuthMessage.decode
AuthResponse.isValidJWT = AuthMessage.isValidJWT
AuthResponse.getPublicKeyPEM = AuthMessage.getPublicKeyPEM
AuthResponse.verify = AuthMessage.verify

function AuthResponse(signingKey, verifyingKey, challenge, blockchainid, publicKeychain, chainPath) {
    this.keyEncoder = new KeyEncoder(SECP256k1Parameters)

    this.signingKey = signingKey
    this.verifyingKey = verifyingKey
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
            publicKey: this.verifyingKey
        },
        issuedAt: new Date().getTime(),
        challenge: this.challenge
    }

    if (this.blockchainid && this.publicKeychain && this.chainPath) {
        payload['issuer'] = {
            publicKey: this.verifyingKey,
            blockchainid: this.blockchainid,
            publicKeychain: this.publicKeychain,
            chainPath: this.chainPath
        }
    }

    return payload
}

AuthResponse.hasValidIssuer = function(decodedToken, resolver, resolve, reject) {
    if (!hasProperty(decodedToken, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    if (!(hasProperty(decodedToken, 'issuer.blockchainid') &&
        hasProperty(decodedToken, 'issuer.publicKeychain') &&
        hasProperty(decodedToken, 'issuer.chainPath'))) {
        reject('token must have a blockchainid, publicKeychain, and chainPath')
    }

    var blockchainid = decodedToken.issuer.blockchainid,
        publicKeychain = decodedToken.issuer.publicKeychain,
        childPublicKey = decodedToken.issuer.childPublicKey,
        chainPath = decodedToken.issuer.chainPath

    var publicKeychainInProfile = isPublicKeychainInProfile(blockchainid, publicKeychain, resolver)
    var masterAndChildKeysMatch = doMasterAndChildKeysMatch(publicKeychain, childPublicKey, chainPath)
    var hasValidIssuer = (publicKeychainInProfile && masterAndChildKeysMatch)
    return hasValidIssuer
}

module.exports = {
    AuthResponse: AuthResponse
}
