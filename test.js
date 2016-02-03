'use strict'

var test = require('tape'),
    fs = require('fs')

var TokenSigner = require('jwt-js').TokenSigner,
    TokenVerifier = require('jwt-js').TokenVerifier,
    decodeToken = require('jwt-js').decodeToken,
    PrivateKeychain = require('elliptic-keychain').PrivateKeychain,
    PublicKeychain = require('elliptic-keychain').PublicKeychain,
    dateFormat = require('dateformat')

var profileDirectory = require('./sample-data')

var Person = require('./index').Person,
    Organization = require('./index').Organization,
    CreativeWork = require('./index').CreativeWork,
    signProfileTokens = require('./index').signProfileTokens,
    getProfileFromTokens = require('./index').getProfileFromTokens,
    validateTokenRecord = require('./index').validateTokenRecord

var rawPrivateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b22901',
    rawPublicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69',
    tokenVerifier = new TokenVerifier('ES256K', rawPublicKey),
    privateKeychain = new PrivateKeychain(),
    publicKeychain = privateKeychain.publicKeychain()

function testTokening(profile) {
  var tokenRecords = []

  test('profileToTokens', function(t) {
    t.plan(2)

    tokenRecords = signProfileTokens([profile], privateKeychain)
    t.ok(tokenRecords, 'Tokens should have been created')
    //console.log(JSON.stringify(tokenRecords, null, 2))

    var tokensVerified = true
    tokenRecords.map(function(tokenRecord) {
      try {
        validateTokenRecord(tokenRecord, publicKeychain)
      } catch(e) {
        throw e
      }
    })
    t.equal(tokensVerified, true, 'All tokens should be valid')
  })

  test('tokensToProfile', function(t) {
    t.plan(2)

    var recoveredProfile = getProfileFromTokens(tokenRecords, publicKeychain)
    //console.log(recoveredProfile)
    t.ok(recoveredProfile, 'Profile should have been reconstructed')
    t.equal(JSON.stringify(recoveredProfile), JSON.stringify(profile), 'Profile should equal the reference')
  })
}

testTokening(profileDirectory.naval_profile)
testTokening(profileDirectory.google_id)
testTokening(profileDirectory.balloondog_art)