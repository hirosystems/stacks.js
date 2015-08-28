
var jwt = require('jwt'),
    bitcore = require('bitcore'),
    hasProperty = require('hasprop'),
    AuthMessage = require('auth-message')

AuthResponse.prototype = new AuthMessage()
AuthResponse.prototype.constructor = AuthResponse

function AuthResponse(signingKey, verifyingKey, challenge, blockchainid) {
    this.signingKey = signingKey
    this.verifyingKey = verifyingKey
    this.challenge = challenge
}

AuthResponse.prototype.identifyUser = function(blockchainid, publicKeychain, chainPath) {
    this.blockchainid = blockchainid
    this.publicKeychain = publicKeychain
    this.chainPath = chainPath
}

AuthResponse.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.publicKey
        },
        issuedAt: new Date.getTime(),
        challenge: this.challenge
    }

    if (this.blockchainid && this.publicKeychain && this.chainPath) {
        payload['issuer'] = {
            publicKey: this.publicKey,
            blockchainid: this.blockchainid,
            publicKeychain: this.publicKeychain,

        }
    }

    return payload
}

AuthResponse.hasValidIssuer = function(decodedToken) {
    return false
}
