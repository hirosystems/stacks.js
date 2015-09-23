'use strict'

var Tokenizer = require('jwt-js').Tokenizer,
    KeyEncoder = require('key-encoder'),
    hasProperty = require('hasprop'),
    Promise = require('promise'),
    verifyDomainKey = require('./utils').verifyDomainKey,
    verifyKeychainChild = require('./utils').verifyKeychainChild,
    verifyBlockchainIDKeychain = require('./utils').verifyBlockchainIDKeychain

function AuthVerifier(resolver) {
    this.resolver = resolver
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.tokenizer = new Tokenizer('ES256k')
}

AuthVerifier.prototype.decode = function(token) {
    return this.tokenizer.decode(token)
}

AuthVerifier.prototype.isValidJWT = function(token, rawPublicKey, resolve, reject) {
    var verified = this.tokenizer.verify(token, rawPublicKey)
    resolve(verified)
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
        rawPublicKey

    if (!hasProperty(payload, 'issuer.publicKey')) {
        callbackFunction('the token is missing a public key PEM', false)
    } else {
        rawPublicKey = payload.issuer.publicKey
    }
    
    var isValidJWTPromise = new Promise(function(resolve, reject) {
        _this.isValidJWT(token, rawPublicKey, resolve, reject)
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

    if (!hasProperty(payload, 'issuer.blockchainid') &&
        !hasProperty(payload, 'issuer.publicKeychain') &&
        !hasProperty(payload, 'issuer.chainPath')) {
        resolve(true)
    } else if (!(hasProperty(payload, 'issuer.blockchainid') &&
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
