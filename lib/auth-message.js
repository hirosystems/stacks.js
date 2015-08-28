function AuthMessage() {
}

AuthMessage.prototype.token = function() {
    var payload, signingKeyPEM, jwtOptions, token

    payload = this.payload()
    signingKeyPEM = this.signingKey
    jwtOptions = {algorithm: 'ES256'}
    token = jwt.sign(payload, signingKeyPEM, jwtOptions)
    
    return token
}

AuthMessage.prototype.json = function() {
    return AuthResponse.decode(this.token())
}

AuthResponse.decode = function(token) {
    return jwt.decode(token, {complete: true})
}
