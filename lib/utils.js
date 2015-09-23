'use strict'

var hasprop = require('hasprop'),
    deriveChildPublicKey = require('keychain-manager').deriveChildPublicKey

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

function verifyKeychainChild(publicKeychain, childPublicKey, chainPath, callback) {
    var derivedPublicKey = deriveChildPublicKey(publicKeychain, chainPath)
    callback(derivedPublicKey === childPublicKey)
}

module.exports = {
    verifyDomainKey: verifyDomainKey,
    verifyBlockchainIDKeychain: verifyBlockchainIDKeychain,
    verifyKeychainChild: verifyKeychainChild
}