
function AuthRequest(signingKey, verifyingKey, issuingDomain, permissions) {
    this.signingKey = signingKey
    this.verifyingKey = verifyingKey
    this.issuingDomain = issuingDomain
    this.permissions = permissions
}

AuthRequest.prototype.payload = function() {
    var payload = {
        issuer: {
            publicKey: this.publicKey,
            domain: this.issuingDomain
        },
        issuedAt: new Date.getTime(),
        challenge: this.challenge,
        permissions: this.permissions
    }
    return payload
}

AuthRequest.hasValidIssuer = function(decodedToken) {
    return false
}