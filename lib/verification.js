'use strict'

var TokenVerifier = require('jwt-js').TokenVerifier,
    KeyEncoder = require('key-encoder'),
    hasprop = require('hasprop'),
    Promise = require('promise'),
    decodeToken = require('jwt-js').decodeToken,
    PublicKeychain = require('keychain-manager').PublicKeychain

function verifyAuthInProfile(blockchainIDResolver, username, key, isKeychain, resolve, reject) {
    blockchainIDResolver([username], function(data) {
        if (data === null || data === '') {
            resolve(false)
        }

        if (data.hasOwnProperty(username)) {
            var item = data[username]
            if (hasprop(item, 'profile.auth')) {
                var authInfo = data[username].profile.auth
                if (Object.prototype.toString.call(authInfo) === '[object Array]') {
                    authInfo.forEach(function(authItem) {
                        if (isKeychain) {
                            if (hasprop(authItem, 'publicKeychain')) {
                                if (key === authItem.publicKeychain) {
                                    resolve(true)
                                    return
                                }
                            }
                        } else {
                            if (hasprop(authItem, 'publicKey')) {
                                if (key === authItem.publicKey) {
                                    resolve(true)
                                    return
                                }
                            }
                        }
                    })
                }
            }
        }
        resolve(false)
    }, function(err) {
        reject(err)
    })
}

function verifyKeychainChild(publicKeychain, childPublicKey, chainPath, resolve, reject) {
    var publicKeychain = new PublicKeychain(publicKeychain)
    var derivedChildPublicKey = publicKeychain.descendant(chainPath).publicKey().toString()
    resolve(derivedChildPublicKey === childPublicKey)
}

function verifyAuthMessage(token, blockchainIDResolver, resolve, reject) {
    var decodedToken = decodeToken(token),
        payload = decodedToken.payload

    if (!hasprop(payload, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    var hasKeychain,
        publicKey = payload.issuer.publicKey

    var tokenVerifier = new TokenVerifier('ES256k', publicKey),
        tokenSignerVerified = tokenVerifier.verify(token)

    if (!tokenSignerVerified) {
        resolve(tokenSignerVerified)
        return
    }

    if (!hasprop(payload, 'issuer.username') &&
        !hasprop(payload, 'issuer.publicKeychain') &&
        !hasprop(payload, 'issuer.chainPath')) {
        // Issuer only contains the public key
        resolve(tokenSignerVerified)
        return
    } else if (hasprop(payload, 'issuer.username') &&
        !hasprop(payload, 'issuer.publicKeychain') &&
        !hasprop(payload, 'issuer.chainPath')) {
        // Issuer only contains the blockchain ID and signing public key
        hasKeychain = false
    } else if (hasprop(payload, 'issuer.username') &&
        hasprop(payload, 'issuer.publicKeychain') &&
        hasprop(payload, 'issuer.chainPath')) {
        // Issuer contains the blockchain ID, public keychain, chain path,
        // and signing public key
        hasKeychain = true
    } else {
        // Issuer is invalid
        reject('token must have a username, and may have a publicKeychain and chainPath')
    }

    var username = payload.issuer.username

    if (!hasKeychain) {
        var verifyAuthInProfilePromise = new Promise(function(resolve, reject) {
            verifyAuthInProfile(blockchainIDResolver, username, publicKey, false, resolve, reject)
        })

        verifyAuthInProfilePromise.then(function(value) {
            resolve(value)
        })
    } else {
        var publicKeychain = payload.issuer.publicKeychain,
            childPublicKey = payload.issuer.publicKey,
            chainPath = payload.issuer.chainPath
        
        var verifyKeychainChildPromise = new Promise(function(resolve, reject) {
            verifyKeychainChild(publicKeychain, childPublicKey, chainPath, resolve, reject)
        })

        var verifyAuthInProfilePromise = new Promise(function(resolve, reject) {
            verifyAuthInProfile(blockchainIDResolver, username, publicKeychain, true, resolve, reject)
        })

        Promise.all([verifyKeychainChildPromise, verifyAuthInProfilePromise])
        .then(function(results) {
            var keychainChildIsValid = results[0],
                authInProfileIsValid = results[1]
            resolve(keychainChildIsValid && authInProfileIsValid)
        }, function(err) {
            reject(err)
        })
    }
}

module.exports = {
    verifyAuthMessage: verifyAuthMessage
}