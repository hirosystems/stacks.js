'use strict'

var jwt = require('jsonwebtoken'),
    hasProperty = require('hasprop'),
    KeyEncoder = require('ecdsa-key-encoder').KeyEncoder,
    SECP256k1Parameters = require('ecdsa-key-encoder').SECP256k1Parameters

function AuthMessage() {
}

AuthMessage.prototype.signingKeyPEM = function() {
    return this.keyEncoder.hexToPrivatePEM(this.signingKey)
}

AuthMessage.prototype.token = function() {
    return jwt.sign(this.payload(), this.signingKeyPEM(), {algorithm: 'ES256'})
}

AuthMessage.prototype.json = function() {
    return AuthResponse.decode(this.token())
}

AuthMessage.decode = function(token) {
    return jwt.decode(token, {complete: true})
}

AuthMessage.isValidJWT = function(token, publicKeyPEM, resolve, reject) {
    jwt.verify(token, publicKeyPEM, function(err, decoded) {
        if (err) {
            reject(err)
        } else {
            resolve(decoded)
        }
    })
}

AuthMessage.getPublicKeyPEM = function(decodedToken, resolve, reject) {
    if (hasProperty(decodedToken, 'issuer.publicKey')) {
        publicKeyPEM = this.keyEncoder.hexToPublicPEM(decodedToken.issuer.publicKey)
        resolve(publicKeyPEM)
    } else {
        reject('token does not have an issuer publicKey')
    }
}

AuthMessage.verify = function(token, resolve, reject) {
    var _this = this,
        decodedToken = this.decode(token),
        publicKeyPEM = this.getPublicKeyPEM(decodedToken)
    
    var isValidJWTPromise = new Promise(function(resolve, reject) {
        this.isValidJWT(token, publicKeyPEM, resolve, reject)
    })

    var hasValidIssuerPromise = new Promise(function(resolve, reject) {
        this.hasValidIssuer(decodedToken, resolve, reject)
    })

    Promise.all([isValidJWTPromise, hasValidIssuerPromise])
    .then(function(results) {
        var isValidJWT = results[0],
            hasValidIssuer = results[1]
        resolve(isValidJWT && hasValidIssuer)
    }, function(err) {
        reject(err)
    })
}

module.exports = {
    AuthMessage: AuthMessage
}