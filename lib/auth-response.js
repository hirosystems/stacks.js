'use strict'

var KeyEncoder = require('key-encoder'),
    TokenSigner = require('jwt-js').TokenSigner,
    decodeToken = require('jwt-js').decodeToken,
    secp256k1 = require('elliptic-curve').secp256k1,
    uuid = require('node-uuid')

function AuthResponse(privateKey) {
    this.privateKey = privateKey
    this.keyEncoder = new KeyEncoder('secp256k1')
    this.publicKey = secp256k1.getPublicKey(privateKey)
    this.tokenSigner = new TokenSigner('ES256k', privateKey)
    this.issuer = { publicKey: this.publicKey }
}

AuthResponse.prototype.satisfyProvisions = function(provisions, username, privateData) {
    var _this = this
    provisions.forEach(function(provision) {
        switch(provision.action) {
            case 'disclose':
                if (provision.scope === 'username' && username) {
                    provision.data = username
                }
                break;
            case 'sign':
                if (provision.data) {
                    var signature = secp256k1.signMessage(provision.data, _this.privateKey)
                    provision.signature = signature
                }
                break;
            case 'write':
                break;
            default:
                break;
        }
    })

    this.provisions = provisions
}

AuthResponse.prototype.setIssuer = function(username, publicKeychain, chainPath) {
    if (username && publicKeychain && chainPath) {
        this.issuer = {
            publicKey: this.publicKey,
            username: username,
            publicKeychain: publicKeychain,
            chainPath: chainPath
        }
    } else if (username) {
        this.issuer = {
            publicKey: this.publicKey,
            username: username
        }
    } else if (username || publicKeychain || chainPath) {
        throw 'Either all or none of the following must be provided: username, publicKeychain, chainPath'
    } else {
        throw 'Cannot set issuer without the following: username, publicKeychain, chainPath'
    }
}

AuthResponse.prototype.payload = function() {
    var payload = {
        issuer: this.issuer,
        issuedAt: new Date().getTime(),
        provisions: this.provisions
    }
    return payload
}

AuthResponse.prototype.sign = function() {
    return this.tokenSigner.sign(this.payload())
}

module.exports = AuthResponse
