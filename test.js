'use strict'

var test = require('tape'),
    AuthMessage = require('./index').AuthMessage,
    AuthRequest = require('./index').AuthRequest,
    AuthResponse = require('./index').AuthResponse,
    verifyAuthMessage = require('./index').verifyAuthMessage,
    decodeToken = require('./index').decodeToken,
    OnenameClient = require('onename-api').OnenameClient

var onenameResolver = new OnenameClient(process.env.ONENAME_APP_ID, process.env.ONENAME_APP_SECRET)

function testBlockchainIDResolver(blockchainids, resolve, reject) {
    if (blockchainids[0] === 'onename') {
        resolve({
            "onename": {
                "profile": {
                    "auth": [
                        {
                            "publicKey": "027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69"
                        }
                    ]
                }
            }
        })
    } else if (blockchainids[0] === 'ryan') {
        resolve({
            "ryan": {
                "profile": {
                    "auth": [
                        {
                            "publicKeychain": "xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ"
                        }
                    ]
                }
            }
        })
    } else {
        resolve(null)
    }
}

function testAuthRequest() {
    var privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229',
        publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

    var issuingBlockchainID = 'onename',
        permissions = ['blockchainid'],
        sampleToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjE0NDA3MTM0MTQuMTkiLCJjaGFsbGVuZ2UiOiIxZDc4NTBkNy01YmNmLTQ3ZDAtYTgxYy1jMDA4NTc5NzY1NDQiLCJwZXJtaXNzaW9ucyI6WyJibG9ja2NoYWluaWQiXSwiaXNzdWVyIjp7InB1YmxpY0tleSI6IjAzODI3YjZhMzRjZWJlZTZkYjEwZDEzNzg3ODQ2ZGVlYWMxMDIzYWNiODNhN2I4NjZlMTkyZmEzNmI5MTkwNjNlNCIsImRvbWFpbiI6Im9uZW5hbWUuY29tIn19.96Q_O_4DX8uPy1enosEwS2sIcyVelWhxvfj2F8rOvHldhqt9YRYilauepb95DVnmpqpCXxJb7jurT8auNCbptw',
        sampleTokenPayload = {"issuedAt": "1440713414.19", "challenge": "1d7850d7-5bcf-47d0-a81c-c00857976544", "permissions": ["blockchainid"], "issuer": {"publicKey": "03827b6a34cebee6db10d13787846deeac1023acb83a7b866e192fa36b919063e4", "domain": "onename.com"}}

    test('basicRequest', function(t) {
        t.plan(4)

        var authRequest = new AuthRequest(privateKey)

        authRequest.prepare(issuingBlockchainID, permissions)
        
        var authRequestToken = authRequest.sign(),
            decodedAuthRequestToken = decodeToken(authRequestToken)
        
        t.ok(authRequest instanceof AuthRequest, 'authRequest should be a valid AuthMessage object')
        t.equal(typeof authRequestToken, 'string', 'token should be a string')
        t.equal(decodedAuthRequestToken.payload.issuer.blockchainid, issuingBlockchainID, 'token blockchain id should match the reference')

        verifyAuthMessage(authRequestToken, testBlockchainIDResolver, function(verified) {
            t.equal(verified, true, 'token should be verified')
        }, function(err) {
            console.log(err)
        })
    })

    test('requestDecoding', function(t) {
        t.plan(1)

        var decodedSampleToken = decodeToken(sampleToken)
        t.equal(JSON.stringify(decodedSampleToken.payload), JSON.stringify(sampleTokenPayload), 'token payload should match the reference payload')
    })
}


function testAuthResponse() {
    var privateKeyHex = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f',
        publicKeyHex = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479',
        publicKeychain = 'xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ',
        privateKeychain = 'xprv9s21ZrQH143K2vRPJpXPhcT12MDpL3rofvjagwKn4yZpPPFpgWn1cy1Wwp3pk78wfHSLcdyZhmEBQsZ29ZwFyTQhhkVVa9QgdTC7hGMB1br',
        chainPath = 'bd62885ec3f0e3838043115f4ce25eedd22cc86711803fb0c19601eeef185e39',
        challenge = '7cd9ed5e-bb0e-49ea-a323-f28bde3a0549',
        blockchainid = 'ryan',
        sampleToken = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3N1ZWRBdCI6IjE0NDA3MTM0MTQuODUiLCJjaGFsbGVuZ2UiOiI3Y2Q5ZWQ1ZS1iYjBlLTQ5ZWEtYTMyMy1mMjhiZGUzYTA1NDkiLCJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDNmZGQ1N2FkZWMzZDQzOGVhMjM3ZmU0NmIzM2VlMWUwMTZlZGE2YjU4NWMzZTI3ZWE2NjY4NmMyZWE1MzU4NDc5IiwiY2hhaW5QYXRoIjoiYmQ2Mjg4NWVjM2YwZTM4MzgwNDMxMTVmNGNlMjVlZWRkMjJjYzg2NzExODAzZmIwYzE5NjAxZWVlZjE4NWUzOSIsInB1YmxpY0tleWNoYWluIjoieHB1YjY2MU15TXdBcVJiY0ZRVnJRcjRRNGtQamFQNEpqV2FmMzlmQlZLalBkSzZvR0JheUU0NkdBbUt6bzVVRFBRZExTTTlEdWZaaVA4ZWF1eTU2WE51SGljQnlTdlpwN0o1d3N5UVZwaTJheHpaIiwiYmxvY2tjaGFpbmlkIjoicnlhbiJ9fQ.oO7ROPKq3T3X0azAXzHsf6ub6CYy5nUUFDoy8MS22B3TlYisqsBrRtzWIQcSYiFXLytrXwAdt6vjehj3OFioDQ',
        sampleTokenPayload = {"issuedAt": "1440713414.85", "challenge": "7cd9ed5e-bb0e-49ea-a323-f28bde3a0549", "issuer": {"publicKey": "03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479", "chainPath": "bd62885ec3f0e3838043115f4ce25eedd22cc86711803fb0c19601eeef185e39", "publicKeychain": "xpub661MyMwAqRbcFQVrQr4Q4kPjaP4JjWaf39fBVKjPdK6oGBayE46GAmKzo5UDPQdLSM9DufZiP8eauy56XNuHicBySvZp7J5wsyQVpi2axzZ", "blockchainid": "ryan"}},
        partiallyIdentifiedToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJpc3N1ZXIiOnsicHVibGljS2V5IjoiMDNmZGQ1N2FkZWMzZDQzOGVhMjM3ZmU0NmIzM2VlMWUwMTZlZGE2YjU4NWMzZTI3ZWE2NjY4NmMyZWE1MzU4NDc5IiwiYmxvY2tjaGFpbmlkIjoicnlhbiIsInB1YmxpY0tleWNoYWluIjoieHB1YjY2MU15TXdBcVJiY0ZRVnJRcjRRNGtQamFQNEpqV2FmMzlmQlZLalBkSzZvR0JheUU0NkdBbUt6bzVVRFBRZExTTTlEdWZaaVA4ZWF1eTU2WE51SGljQnlTdlpwN0o1d3N5UVZwaTJheHpaIn0sImlzc3VlZEF0IjoxNDQxNzU1NjE5MDk2LCJjaGFsbGVuZ2UiOiI3Y2Q5ZWQ1ZS1iYjBlLTQ5ZWEtYTMyMy1mMjhiZGUzYTA1NDkiLCJpYXQiOjE0NDE3NTU2MTl9.1LxW_yg2z40Qd84x0kep0-7TWiDdTEoJbdYFUJ3qt297zxbwo8OOvYW43W6TMT5cloxur5wifq0WoOTdXw4C_Q',
        incorrectBlockchainID = 'ryanshea'

    test('basicResponse', function(t) {
        t.plan(4)

        var authResponse = new AuthResponse(privateKeyHex)

        authResponse.prepare(challenge, blockchainid, publicKeychain, chainPath)

        var authResponseToken = authResponse.sign(),
            decodedAuthResponseToken = decodeToken(authResponseToken)

        t.ok(authResponse instanceof AuthResponse, 'authRequest should be a valid AuthResponse object')
        t.equal(typeof authResponseToken, 'string', 'token should be a string')
        t.equal(decodedAuthResponseToken.payload.issuer.publicKey, publicKeyHex, 'token public key hex should match the reference value')

        verifyAuthMessage(authResponseToken, testBlockchainIDResolver, function(verified) {
            t.equal(verified, true, 'token should be verified')
        }, function(err) {
            console.log(err)
        })
    })
    
    test('partiallyIdentifiedResponse', function(t) {
        t.plan(1)

        verifyAuthMessage(partiallyIdentifiedToken, testBlockchainIDResolver, function(verified) {
            t.equal(verified, false, 'token should be invalid')
        }, function(err) {
            console.log(err)
        })
    })

    test('responseWithIncorrectBlockchainID', function(t) {
        t.plan(2)

        var authResponse = new AuthResponse(privateKeyHex, publicKeyHex)

        authResponse.prepare(challenge, incorrectBlockchainID, publicKeychain, chainPath)

        var authResponseToken = authResponse.sign()
        t.ok(authResponseToken, 'token should have been created')

        verifyAuthMessage(authResponseToken, testBlockchainIDResolver, function(verified) {
            console.log(verified)
            t.equal(verified, false, 'token should be invalid')
        }, function(err) {
            console.log(err)
        })
    })

    test('anonymousResponse', function(t) {
        t.plan(4)

        var authResponse = new AuthResponse(privateKeyHex)

        authResponse.prepare(challenge)

        var authResponseToken = authResponse.sign(),
            decodedAuthResponseToken = decodeToken(authResponseToken)

        t.ok(authResponse instanceof AuthResponse, 'authRequest should be a valid AuthResponse object')
        t.equal(typeof authResponseToken, 'string', 'token should be a string')
        t.equal(decodedAuthResponseToken.payload.issuer.publicKey, publicKeyHex, 'token public key hex should match the reference value')

        verifyAuthMessage(authResponseToken, testBlockchainIDResolver, function(verified) {
            t.equal(verified, true, 'token should be verified')
        }, function(err) {
            console.log(err)
        })
    })

    test('responseDecoding', function(t) {
        t.plan(1)

        var decodedSampleToken = decodeToken(sampleToken)
        t.equal(JSON.stringify(decodedSampleToken.payload), JSON.stringify(sampleTokenPayload), 'token payload should match the reference payload')
    })
}


testAuthRequest()
testAuthResponse()
