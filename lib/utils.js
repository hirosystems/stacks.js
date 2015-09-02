'use strict'

var hasprop = require('hasprop'),
    bitcore = require('bitcore'),
    HDPublicKey = bitcore.HDPublicKey,
    PublicKey = bitcore.PublicKey

function verifyDomainKey(domain, publicKey, resolver, callback) {
    resolver.getDKIMInfo(domain, function(err, data) {
        var match = false
        if (err) {
            // do nothing
        } else {
            if (hasprop(data, 'public_key')) {
                if (publicKey === data.public_key) {
                    match = true
                }
            }
        }
        callback(match)
    })
}

function verifyBlockchainIDKeychain(blockchainid, publicKeychain, resolver, callback) {
    resolver.getUsers([blockchainid], function(err, data) {
        var match = false
        if (err) {
            // do nothing
        } else {
            if (hasprop(data, blockchainid + '.profile.auth')) {
                var authInfo = data[blockchainid].profile.auth
                if (Object.prototype.toString.call(authInfo) === '[object Array]') {
                    authInfo.forEach(function(authItem) {
                        if (hasprop(authItem, 'publicKeychain')) {
                            if (publicKeychain === authItem.publicKeychain) {
                                match = true
                            }
                        }
                    })
                }
            }
        }
        callback(match)
    })
}

function decompressPublicKey(compressedPublicKey) {
    var publicKey = PublicKey(compressedPublicKey),
        publicKeyObject = publicKey.toObject(),
        uncompressedPublicKey = '04' + publicKeyObject.x + publicKeyObject.y
    return uncompressedPublicKey
}

function loadPublicKey(publicKey) {
    if (publicKey.length === 66) {
        return decompressPublicKey(publicKey)
    } else if (publicKey.length === 130) {
        return publicKey
    } else {
        throw 'invalid public key'
    }
}

function loadPrivateKey(privateKey) {
    if (privateKey.length === 66) {
        return privateKey.substring(0,64)
    } else if (privateKey.length === 64) {
        return privateKey
    } else {
        throw 'invalid private key'
    }
}

function deriveKeychainChild(publicKeychain, chainPath) {
    var currentKeychain = HDPublicKey(publicKeychain),
        chainPathParts = chainPath.match(/.{1,8}/g),
        chainSteps = []

    chainPathParts.forEach(function(part) {
        var chainStep = parseInt(part, 16) % Math.pow(2, 31)
        chainSteps.push(chainStep)
    })

    chainSteps.forEach(function(chainStep) {
        currentKeychain = currentKeychain.derive(chainStep, false)
    })

    return currentKeychain.publicKey.toString()
}

function verifyKeychainChild(publicKeychain, childPublicKey, chainPath, callback) {
    var derivedPublicKey = deriveKeychainChild(publicKeychain, chainPath)
    callback(derivedPublicKey === childPublicKey)
}

module.exports = {
    verifyDomainKey: verifyDomainKey,
    verifyBlockchainIDKeychain: verifyBlockchainIDKeychain,
    verifyKeychainChild: verifyKeychainChild,
    decompressPublicKey: decompressPublicKey,
    loadPrivateKey: loadPrivateKey,
    loadPublicKey: loadPublicKey
}