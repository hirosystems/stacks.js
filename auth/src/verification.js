'use strict'

import { TokenVerifier, decodeToken } from 'jsontokens'
import { KeyEncoder } from 'key-encoder'
import hasprop from 'hasprop'
import Promise from 'promise'
import { PublicKeychain } from 'keychain-manager'

export function verifyAuthInProfile(
    blockstackResolver, username, key, isKeychain, resolve, reject) {
    /* Verifies the auth field in a user profile */

    blockstackResolver([username], function(data) {
        if (data === null || data === '') {
            resolve(false)
        }

        if (data.hasOwnProperty(username)) {
            let item = data[username]
            if (hasprop(item, 'profile.auth')) {
                let authInfo = data[username].profile.auth
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

export function verifyKeychainChild(
    publicKeychainString, childPublicKey, chainPath, resolve, reject) {
    let publicKeychain = new PublicKeychain(publicKeychainString)
    let derivedChildPublicKey = publicKeychain.descendant(chainPath).publicKey().toString()
    resolve(derivedChildPublicKey === childPublicKey)
}

export function verifyAuthMessage(token, blockstackResolver, resolve, reject) {
    let decodedToken = decodeToken(token),
        payload = decodedToken.payload

    if (!hasprop(payload, 'issuer.publicKey')) {
        reject('token must have a public key')
    }

    let hasKeychain,
        publicKey = payload.issuer.publicKey

    let tokenVerifier = new TokenVerifier('ES256k', publicKey),
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

    let username = payload.issuer.username

    if (!hasKeychain) {
        let verifyAuthInProfilePromise = new Promise(function(resolve, reject) {
            verifyAuthInProfile(blockstackResolver, username, publicKey, false, resolve, reject)
        })

        verifyAuthInProfilePromise.then(function(value) {
            resolve(value)
        })
    } else {
        let publicKeychain = payload.issuer.publicKeychain,
            childPublicKey = payload.issuer.publicKey,
            chainPath = payload.issuer.chainPath
        
        let verifyKeychainChildPromise = new Promise(function(resolve, reject) {
            verifyKeychainChild(publicKeychain, childPublicKey, chainPath, resolve, reject)
        })

        let verifyAuthInProfilePromise = new Promise(function(resolve, reject) {
            verifyAuthInProfile(blockstackResolver, username, publicKeychain, true, resolve, reject)
        })

        Promise.all([verifyKeychainChildPromise, verifyAuthInProfilePromise])
        .then(function(results) {
            let keychainChildIsValid = results[0],
                authInProfileIsValid = results[1]
            resolve(keychainChildIsValid && authInProfileIsValid)
        }, function(err) {
            reject(err)
        })
    }
}