// import test from 'tape'
import * as test from 'tape-promise/tape'
import { decodeToken, TokenSigner } from 'jsontokens'
import * as FetchMock from 'fetch-mock'

import {
  makeECPrivateKey,
  getPublicKeyFromPrivate,
  makeAuthResponse,
  verifyAuthRequest,
  verifyAuthResponse,
  publicKeyToAddress,
  makeDIDFromAddress,
  isExpirationDateValid,
  isIssuanceDateValid,
  doSignaturesMatchPublicKeys,
  doPublicKeysMatchIssuer,
  doPublicKeysMatchUsername,
  isManifestUriValid,
  isRedirectUriValid,
  verifyAuthRequestAndLoadManifest,
  UserSession,
  AppConfig,
  config
} from '../../../src'

import { sampleProfiles, sampleNameRecords } from './sampleData'

// global.window = {}

export function runAuthTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'
  const nameLookupURL = 'https://core.blockstack.org/v1/names/'

  test('makeAuthRequest && verifyAuthRequest', (t) => {
    t.plan(15)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const authRequest = blockstack.makeAuthRequest(privateKey)
    t.ok(authRequest, 'auth request should have been created')
    console.log(authRequest)

    const decodedToken = decodeToken(authRequest)
    t.ok(decodedToken, 'auth request token should have been decoded')
    console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    const origin = 'http://localhost:3000'
    t.equal(decodedToken.payload.iss,
            referenceDID, 'auth request issuer should include the public key')
    t.equal(decodedToken.payload.domain_name,
            origin, 'auth request domain_name should be origin')
    t.equal(decodedToken.payload.redirect_uri,
            'http://localhost:3000', 'auth request redirects to correct uri')
    t.equal(decodedToken.payload.manifest_uri,
            'http://localhost:3000/manifest.json', 'auth request manifest is correct uri')

    t.equal(JSON.stringify(decodedToken.payload.scopes),
            '["store_write"]', 'auth request scopes should be store_write')

    verifyAuthRequest(authRequest)
      .then((verified) => {
        t.true(verified, 'auth request should be verified')
      })

    t.true(isExpirationDateValid(authRequest), 'Expiration date should be valid')
    t.true(isIssuanceDateValid(authRequest), 'Issuance date should be valid')
    t.true(doSignaturesMatchPublicKeys(authRequest), 'Signatures should match the public keys')
    t.true(doPublicKeysMatchIssuer(authRequest), 'Public keys should match the issuer')
    t.true(isManifestUriValid(authRequest), 'Manifest URI should be on the app origin')
    t.true(isRedirectUriValid(authRequest), 'Redirect URL should be to app origin')


    const manifiestUrl = 'http://localhost:3000/manifest.json'
    const manifest = {
      name: 'App',
      start_url: 'http://localhost:3000/',
      description: 'A simple todo app build on blockstack',
      icons: [{
        src: 'http://localhost:3000/logo.png',
        sizes: '400x400',
        type: 'image/png'
      }]
    }
    const manifestString = JSON.stringify(manifest)
    FetchMock.get(manifiestUrl, manifestString)

    verifyAuthRequestAndLoadManifest(authRequest)
      .then((appManifest) => {
        console.log(appManifest)
        t.equal(appManifest.name, 'App', 'should fetch manifest for valid auth request')
      })
  })

  test('make and verify auth request with extraParams', (t) => {
    t.plan(4)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const authRequest = blockstack.makeAuthRequest(
      privateKey, undefined, undefined, undefined, undefined, undefined, { myCustomParam: 'asdf' }
    )
    t.ok(authRequest, 'auth request should have been created')

    const decodedToken = decodeToken(authRequest)
    t.ok(decodedToken, 'auth request token should have been decoded')

    t.equal(decodedToken.payload.myCustomParam, 'asdf', 'custom param from extraParams is included in payload')

    verifyAuthRequest(authRequest)
      .then((verified) => {
        t.true(verified, 'auth request should be verified')
      })
  })

  test('invalid auth request - signature not verified', (t) => {
    t.plan(3)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const authRequest = blockstack.makeAuthRequest(privateKey)
    const invalidAuthRequest = authRequest.substring(0, authRequest.length - 1)

    t.equal(doSignaturesMatchPublicKeys(invalidAuthRequest), false,
            'Signatures should not match the public keys')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })

    verifyAuthRequestAndLoadManifest(invalidAuthRequest)
      .then(() => {
        // no op
      },
            () => {
              t.pass('invalid auth request rejected')
            })
  })

  test('invalid auth request - invalid redirect uri', (t) => {
    t.plan(3)
    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    appConfig.redirectURI = () => 'https://example.com' // monkey patch for test
    const blockstack = new UserSession({ appConfig })

    const invalidAuthRequest = blockstack.makeAuthRequest(privateKey)
    console.log(invalidAuthRequest)
    t.equal(isRedirectUriValid(invalidAuthRequest), false,
            'Redirect URI should be invalid since it does not match origin')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })

    verifyAuthRequestAndLoadManifest(invalidAuthRequest)
      .then(() => {
        // no op
      },
            () => {
              t.pass('invalid auth request rejected')
            })
  })

  test('invalid auth request - invalid manifest uri', (t) => {
    t.plan(2)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    appConfig.manifestURI = () => 'https://example.com/manifest.json' // monkey patch for test
    const blockstack = new UserSession({ appConfig })
    const invalidAuthRequest = blockstack.makeAuthRequest(privateKey)

    t.equal(isManifestUriValid(invalidAuthRequest), false,
            'Manifest URI should be invalid since it does not match origin')

    verifyAuthRequest(invalidAuthRequest)
      .then((verified) => {
        t.equal(verified, false, 'auth request should be unverified')
      })
  })

  test('makeAuthResponse && verifyAuthResponse', (t) => {
    t.plan(11)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, null, null)
    t.ok(authResponse, 'auth response should have been created')

    const decodedToken = decodeToken(authResponse)
    t.ok(decodedToken, 'auth response should have been decoded')
    // console.log(JSON.stringify(decodedToken, null, 2))

    const address = publicKeyToAddress(publicKey)
    const referenceDID = makeDIDFromAddress(address)
    t.equal(decodedToken.payload.iss,
            referenceDID, 'auth response issuer should include the public key')

    t.equal(JSON.stringify(decodedToken.payload.profile),
            JSON.stringify(sampleProfiles.ryan), 'auth response profile should equal the reference value')

    t.equal(decodedToken.payload.username, null, 'auth response username should be null')

    // const verified = verifyAuthResponse(authResponse)
    // t.equal(verified, true, 'auth response should be verified')

    verifyAuthResponse(authResponse, nameLookupURL)
      .then((verifiedResult) => {
        t.true(verifiedResult, 'auth response should be verified')
      })

    t.true(isExpirationDateValid(authResponse), 'Expiration date should be valid')
    t.true(isIssuanceDateValid(authResponse), 'Issuance date should be valid')
    t.true(doSignaturesMatchPublicKeys(authResponse), 'Signatures should match the public keys')
    t.true(doPublicKeysMatchIssuer(authResponse), 'Public keys should match the issuer')

    doPublicKeysMatchUsername(authResponse, nameLookupURL)
      .then((verifiedResult) => {
        t.true(verifiedResult, 'Public keys should match the username')
      })
  })

  test('auth response with username', (t) => {
    t.plan(2)

    const url = `${nameLookupURL}ryan.id`
    // console.log(`URL: ${url}`)

    FetchMock.get(url, sampleNameRecords.ryan)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id', null)
    // console.log(decodeToken(authResponse))

    doPublicKeysMatchUsername(authResponse, nameLookupURL)
      .then((verified) => {
        t.true(verified, 'Public keys should match the username')
      })

    verifyAuthResponse(authResponse, nameLookupURL)
      .then((verifiedResult) => {
        t.true(verifiedResult, 'auth response should be verified')
      })
  })

  test('auth response with invalid private key', (t) => {
    t.plan(2)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })

    const url = `${nameLookupURL}ryan.id`
    // console.log(`URL: ${url}`)

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const badTransitPrivateKey = makeECPrivateKey()
    blockstack.store.getSessionData().transitKey = badTransitPrivateKey
    const metadata = { }

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey)


    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.fail('Should have failed to decrypt auth response')
      })
      .catch((err) => {
        console.log(err)
        t.pass('Should fail to decrypt auth response')
      })
      .then(() => {
        blockstack.store.getSessionData().transitKey = transitPrivateKey

        return blockstack.handlePendingSignIn(authResponse)
      })
      .then(() => {
        t.pass('Should correctly sign in with correct transit key')
      })
      .catch((err) => {
        console.log(err.stack)
        t.fail('Should not error')
      })
  })

  test('handlePendingSignIn with authResponseToken', (t) => {
    t.plan(1)

    const url = `${nameLookupURL}ryan.id`

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const metadata = {}

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().transitKey = transitPrivateKey

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey)

    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.pass('Should correctly sign in with auth response')
      })
      .catch((err) => {
        console.log(err.stack)
        t.fail('Should not error')
      })
  })

  test('handlePendingSignIn 2', (t) => {
    t.plan(1)

    const url = `${nameLookupURL}ryan.id`

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const metadata = {}

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().transitKey = transitPrivateKey

    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.pass('Should correctly sign in with auth response')
      })
      .catch((err) => {
        console.log(err.stack)
        t.fail('Should not error')
      })
  })

  test('handlePendingSignIn with existing user session', (t) => {
    t.plan(1)

    const url = `${nameLookupURL}ryan.id`

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const metadata = {}

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().transitKey = transitPrivateKey

    const sessionData = blockstack.store.getSessionData()
    sessionData.userData = {
      decentralizedID: 'blockstack.id',
      username: 'blockstack.id',
      identityAddress: 'identityaddress',
      appPrivateKey: appPrivateKey,
      hubUrl: '',
      authResponseToken: '',
      profile: ''
    }
    blockstack.store.setSessionData(sessionData)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey)

    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.fail('Should not overwrite existing user');
      })
      .catch((err) => {
        t.pass('Should throw error when overwriting existing user session during handle pending sign in')
      })
  })

  test('app config defaults app domain to origin', (t) => {
    t.plan(5);
    (<any>global).window = {
      location: {
        origin: 'https://example.com'
      }
    }

    const appConfig = new AppConfig()

    t.equal(appConfig.appDomain, 'https://example.com')
    t.equal(appConfig.scopes.length, 1)
    t.equal(appConfig.scopes[0], 'store_write')
    t.equal(appConfig.manifestURI(), 'https://example.com/manifest.json')
    t.equal(appConfig.redirectURI(), 'https://example.com');
    (<any>global).window = undefined
  })

  test('app config works with custom app domain to origin', (t) => {
    t.plan(5);
    (<any>global).window = {
      location: {
        origin: 'https://example.com'
      }
    }

    const appConfig = new AppConfig(['store_write'], 'https://custom.example.com')

    t.equal(appConfig.appDomain, 'https://custom.example.com')
    t.equal(appConfig.scopes.length, 1)
    t.equal(appConfig.scopes[0], 'store_write')
    t.equal(appConfig.manifestURI(), 'https://custom.example.com/manifest.json')
    t.equal(appConfig.redirectURI(), 'https://custom.example.com');
    (<any>global).window = undefined
  })

  test('handlePendingSignIn with authResponseToken, transit key and custom Blockstack API URL', (t) => {
    t.plan(2)

    const customBlockstackAPIUrl = 'https://test.name.lookups'
    const oldBlockstackAPIUrl = config.network.blockstackAPIUrl
    const url = `${customBlockstackAPIUrl}/v1/names/ryan.id`

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const metadata = {}

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().transitKey = transitPrivateKey

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey, undefined, customBlockstackAPIUrl)

    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.pass('Should correctly sign in with auth response')
        t.equal(config.network.blockstackAPIUrl, customBlockstackAPIUrl,
                'Should override global Blockstack API URL')

        config.network.blockstackAPIUrl = oldBlockstackAPIUrl
      })
      .catch((err) => {
        console.log(err.stack)
        t.fail('Should not error')
      })
  })

  test('handlePendingSignIn with authResponseToken, transit key, '
    + 'Blockstack API URL, and Gaia association token', (t) => {
    t.plan(3)

    const customBlockstackAPIUrl = 'https://test.name.lookups'
    const oldBlockstackAPIUrl = config.network.blockstackAPIUrl
    const url = `${customBlockstackAPIUrl}/v1/names/ryan.id`

    FetchMock.get(url, sampleNameRecords.ryan)

    const appPrivateKey = makeECPrivateKey()
    const identityPrivateKey = makeECPrivateKey()
    const transitPrivateKey = makeECPrivateKey()
    const transitPublicKey = getPublicKeyFromPrivate(transitPrivateKey)
    const metadata = {}

    const appPublicKey = getPublicKeyFromPrivate(appPrivateKey)
    const FOUR_MONTH_SECONDS = 60 * 60 * 24 * 31 * 4
    const salt = '00000000000000000000000000000'
    const identityPublicKey = getPublicKeyFromPrivate(identityPrivateKey)
    const associationTokenClaim = {
      childToAssociate: appPublicKey,
      iss: identityPublicKey,
      exp: FOUR_MONTH_SECONDS + (Date.now() / 1000),
      salt
    }
    const gaiaAssociationToken = new TokenSigner('ES256K', identityPrivateKey)
      .sign(associationTokenClaim)

    const authResponse = makeAuthResponse(privateKey, sampleProfiles.ryan, 'ryan.id',
                                          metadata, undefined, appPrivateKey, undefined,
                                          transitPublicKey, undefined, customBlockstackAPIUrl,
                                          gaiaAssociationToken)

    const appConfig = new AppConfig(['store_write'], 'http://localhost:3000')
    const blockstack = new UserSession({ appConfig })
    blockstack.store.getSessionData().transitKey = transitPrivateKey

    blockstack.handlePendingSignIn(authResponse)
      .then(() => {
        t.pass('Should correctly sign in with auth response')
        t.equal(config.network.blockstackAPIUrl, customBlockstackAPIUrl,
                'Should override global Blockstack API URL')

        t.equal(blockstack.loadUserData().gaiaAssociationToken, gaiaAssociationToken,
                'Should have Gaia association token')

        // restore
        config.network.blockstackAPIUrl = oldBlockstackAPIUrl
      })
      .catch((err) => {
        console.log(err.stack)
        t.fail('Should not error')
      })
  })
}
