'use strict'

module.exports = {
    AuthRequest: require('./lib/auth-request'),
    AuthResponse: require('./lib/auth-response'),
    verifyAuthMessage: require('./lib/verification').verifyAuthMessage,
    decodeToken: require('jwt-js').decodeToken
}
