'use strict'

var Tokenizer = require('jwt-js').Tokenizer,
    KeyEncoder = require('key-encoder')

function AuthMessage() {
    this.tokenizer = new Tokenizer('ES256k') 
}

AuthMessage.prototype.token = function() {
    return this.tokenizer.sign(this.payload(), this.privateKey)
}

AuthMessage.prototype.decode = function() {
    return this.tokenizer.decode(this.token())
}

module.exports = AuthMessage