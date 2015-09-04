'use strict'

var jwt = require('jsonwebtoken'),
    KeyEncoder = require('key-encoder').KeyEncoder,
    hasProperty = require('hasprop'),
    utils = require('./utils'),
    verifyDomainKey = utils.verifyDomainKey,
    verifyKeychainChild = utils.verifyKeychainChild,
    verifyBlockchainIDKeychain = utils.verifyBlockchainIDKeychain,
    decompressPublicKey = utils.decompressPublicKey

function AuthVerifier(resolver) {
    this.resolver = resolver
    this.keyEncoder = new KeyEncoder(SECP256k1Parameters)
}

AuthVerifier.prototype.decode = function(token) {
    return jwt.decode(token, {complete: true})
}

AuthVerifier.prototype.isValidJWT = function(token, publicKeyPEM, resolve, reject) {
    jwt.verify(token, publicKeyPEM, function(err, decoded) {
        if (err) {
            reject(err)
        } else {
            resolve(decoded)
        }
    })
}

AuthVerifier.prototype.getPublicKeyPEM = function(payload) {
    if (hasProperty(payload, 'issuer.publicKey')) {
        var publicKey = decompressPublicKey(payload.issuer.publicKey)
        return this.keyEncoder.hexToPublicPEM(publicKey)
    } else {
        return null
    }
}

AuthVerifier.prototype.verifyRequest = function(token, callbackFunction) {
    this.verifyMessage(token, this.requestHasValidIssuer, callbackFunction)
}

AuthVerifier.prototype.verifyResponse = function(token, callbackFunction) {
    this.verifyMessage(token, this.responseHasValidIssuer, callbackFunction)
}

AuthVerifier.prototype.verifyMessage = function(token, validIssuerVerifier, callbackFunction) {
    var _this = this,
        decodedToken = this.decode(token),
        payload = decodedToken.payload,
        publicKeyPEM = this.getPublicKeyPEM(payload)

    if (!publicKeyPEM) {
        callbackFunction('the token is missing a public key PEM', false)
    }
    
    var isValidJWTPromise = new Promise(function(resolve, reject) {
        _this.isValidJWT(token, publicKeyPEM, resolve, reject)
    })

    var hasValidIssuerPromise = new Promise(function(resolve, reject) {
        validIssuerVerifier(payload, _this.resolver, resolve, reject)
    })

    Promise.all([isValidJWTPromise, hasValidIssuerPromise])
    .then(function(results) {
        var validDecodedJWT = results[0],
            hasValidIssuer = results[1],
            verified = (validDecodedJWT && hasValidIssuer)
        callbackFunction(null, verified)
    }, function(err) {
        callbackFunction(err, false)
    })
}

AuthVerifier.prototype.requestHasValidIssuer = function(payload, resolver, resolve, reject) {
    if (!hasProperty(payload, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    if (!hasProperty(payload, 'issuer.domain')) {
        reject('token must have a domain')
    }

    var domain = payload.issuer.domain,
        publicKey = payload.issuer.publicKey

    verifyDomainKey(domain, publicKey, resolver, function(domainAndPublicKeyMatch) {
        resolve(domainAndPublicKeyMatch)
    })
}

AuthVerifier.prototype.responseHasValidIssuer = function(payload, resolver, resolve, reject) {
    if (!hasProperty(payload, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    if (!(hasProperty(payload, 'issuer.blockchainid') &&
          hasProperty(payload, 'issuer.publicKeychain') &&
          hasProperty(payload, 'issuer.chainPath'))) {
        reject('token must have a blockchainid, publicKeychain, and chainPath')
    }

    var blockchainid = payload.issuer.blockchainid,
        publicKeychain = payload.issuer.publicKeychain,
        childPublicKey = payload.issuer.publicKey,
        chainPath = payload.issuer.chainPath

    verifyKeychainChild(publicKeychain, childPublicKey, chainPath, function(keychainMatchesChild) {
        if (!keychainMatchesChild) {
            resolve(false)
        }
        verifyBlockchainIDKeychain(blockchainid, publicKeychain, resolver, function(publicKeychainInProfile) {
            resolve(publicKeychainInProfile && keychainMatchesChild)
        })
    })
}

module.exports = AuthVerifier
