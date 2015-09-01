'use strict'

var hasprop = require('hasprop'),
    bitcore = require('bitcore'),
    HDPublicKey = bitcore.HDPublicKey,
    PublicKey = bitcore.PublicKey

function doDomainAndPublicKeyMatch(domain, publicKey, resolver, callback) {
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

function isPublicKeychainInProfile(blockchainid, publicKeychain, resolver, callback) {
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

function doesKeychainMatchChild(publicKeychainString, childPublicKey, chainPath, callback) {
    var match = false,
        currentKeychain = HDPublicKey(publicKeychainString)

    var chainPathParts = chainPath.match(/.{1,8}/g)
    for (var part in chainPathParts) {
        var derivationNumber = parseInt(part) % Math.pow(2, 31)
        currentKeychain = currentKeychain.derive(derivationNumber, false)
    }

    if (currentKeychain.publicKey === childPublicKey) {
        match = true
    }

    callback(match)
}

module.exports = {
    doDomainAndPublicKeyMatch: doDomainAndPublicKeyMatch,
    isPublicKeychainInProfile: isPublicKeychainInProfile,
    doesKeychainMatchChild: doesKeychainMatchChild
}