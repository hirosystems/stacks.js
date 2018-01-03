import test from 'tape'
import fs from 'fs'
import { ECPair } from 'bitcoinjs-lib'
import FetchMock from 'fetch-mock'
import proxyquire from 'proxyquire'
import sinon from 'sinon'

import {
  signProfileToken,
  wrapProfileToken,
  verifyProfileToken,
  extractProfile,
  Profile,
  Person,
  Organization,
  CreativeWork,
  getEntropy,
  makeZoneFileForHostedProfile,
  resolveZoneFileToPerson,
  makeProfileZoneFile,
  lookupProfile
} from '../../../lib'

import { sampleProfiles, sampleProofs, sampleVerifications, sampleTokenFiles } from './sampleData'

function testTokening(filename, profile) {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

  let tokenRecords = []

  test('profileToToken', (t) => {
    t.plan(3)

    let token = signProfileToken(profile, privateKey)
    t.ok(token, 'Token must have been created')

    let tokenRecord = wrapProfileToken(token)
    t.ok(tokenRecord, 'Token record must have been created')

    let decodedToken = verifyProfileToken(tokenRecord.token, publicKey)
    t.ok(decodedToken, 'Token record must have been verified')
  })

  test('profileToTokens', (t) => {
    t.plan(2)

    tokenRecords = [wrapProfileToken(signProfileToken(profile, privateKey))]
    t.ok(tokenRecords, 'Tokens should have been created')
    //console.log(JSON.stringify(tokenRecords, null, 2))
    //fs.writeFileSync('./docs/token-files/' + filename, JSON.stringify(tokenRecords, null, 2))

    let tokensVerified = true
    tokenRecords.map((tokenRecord) => {
      let decodedToken = verifyProfileToken(tokenRecord.token, publicKey)
    })
    t.equal(tokensVerified, true, 'All tokens should be valid')
  })

  test('tokenToProfile', (t) => {
    t.plan(2)

    let recoveredProfile = extractProfile(tokenRecords[0].token, publicKey)
    //console.log(recoveredProfile)
    t.ok(recoveredProfile, 'Profile should have been reconstructed')
    t.equal(JSON.stringify(recoveredProfile), JSON.stringify(profile), 'Profile should equal the reference')
  })

  test('makeProfileZoneFile', (t) => {
    t.plan(1)

    const origin = 'satoshi.id'
    const tokenFileUrl = 'https://example.com/satoshi.json'
    const expectedZoneFile = '$ORIGIN satoshi.id\n$TTL 3600\n_http._tcp	IN	URI	10	1	"https://example.com/satoshi.json"\n\n'
    const actualZoneFile = makeProfileZoneFile(origin, tokenFileUrl)
    t.equal(actualZoneFile, expectedZoneFile)
  })
}

function testVerifyToken() {
  const tokenFile = sampleTokenFiles.ryan_apr20.body,
        token = tokenFile[0].token

  const publicKey = "02413d7c51118104cfe1b41e540b6c2acaaf91f1e2e22316df7448fb6070d582ec",
        compressedAddress = "1BTku19roxQs2d54kbYKVTv21oBCuHEApF",
        uncompressedAddress = "12wes6TQpDF2j8zqvAbXV9KNCGQVF2y7G5"

  test('verifyToken', (t) => {
    t.plan(3)

    let decodedToken1 = verifyProfileToken(token, publicKey)
    t.ok(decodedToken1, 'Token should have been verified against a public key')

    let decodedToken2 = verifyProfileToken(token, compressedAddress)
    t.ok(decodedToken2, 'Token should have been verified against a compressed address')

    let decodedToken3 = verifyProfileToken(token, uncompressedAddress)
    t.ok(decodedToken3, 'Token should have been verified against an uncompressed address')
  })
}

function testZoneFile() {
  test('makeZoneFileForHostedProfile', (t) => {
    t.plan(3)

    const fileUrl = 'https://mq9.s3.amazonaws.com/naval.id/profile.json'
    const incorrectFileUrl = 'mq9.s3.amazonaws.com/naval.id/profile.json'
    const zoneFile = Profile.makeZoneFile('naval.id', fileUrl)
    t.ok(zoneFile, 'Zone file should have been created for hosted profile')
    t.ok(zoneFile.includes(`"${fileUrl}"`), 'Zone file should include quoted entire profile url')
    t.notOk(zoneFile.includes(`"${incorrectFileUrl}"`),
    'Zone file should not include quoted profile url without protocol')

  })
}
function testSchemas() {
  const keyPair = new ECPair.makeRandom({ rng: getEntropy })
  const privateKey = keyPair.d.toBuffer(32).toString('hex')
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex')

  test('Profile', (t) => {
    t.plan(5)

    let profileObject = new Profile(sampleProfiles.naval)
    t.ok(profileObject, 'Profile object should have been created')

    let validationResults = Profile.validateSchema(sampleProfiles.naval)
    t.ok(validationResults.valid, 'Profile should be valid')

    let profileJson = profileObject.toJSON()
    t.ok(profileJson, 'Profile JSON should have been created')

    let tokenRecords = profileObject.toToken(privateKey)
    t.ok(tokenRecords, 'Profile tokens should have been created')

    let profileObject2 = Profile.fromToken(tokenRecords, publicKey)
    t.ok(profileObject2, 'Profile should have been reconstructed from tokens')
  })

  test('Person', (t) => {
    t.plan(18)

    let personObject = new Person(sampleProfiles.naval)
    t.ok(personObject, 'Person object should have been created')

    let validationResults = Person.validateSchema(sampleProfiles.naval, true)
    t.ok(validationResults.valid, 'Person profile should be valid')

    let token = personObject.toToken(privateKey)
    let tokenRecords = [wrapProfileToken(token)]
    t.ok(tokenRecords, 'Person profile tokens should have been created')
    //fs.writeFileSync('./docs/token-files/naval-4-tokens.json', JSON.stringify(tokenRecords, null, 2))

    let profileObject2 = Person.fromToken(tokenRecords[0].token, publicKey)
    t.ok(profileObject2, 'Person profile should have been reconstructed from tokens')

    let name = personObject.name()
    t.ok(name, 'Name should have been returned')
    t.equal(name, 'Naval Ravikant', 'Name should match the expected value')

    let givenName = personObject.givenName()
    t.ok(givenName, 'Given name should have been returned')
    t.equal(givenName, 'Naval', 'Given name should match the expected value')

    let familyName = personObject.familyName()
    t.ok(familyName, 'Family name should have been returned')
    t.equal(familyName, 'Ravikant', 'Family name should match the expected value')

    let description = personObject.description()
    t.ok(description, 'Avatar URL should have been returned')

    let avatarUrl = personObject.avatarUrl()
    t.ok(avatarUrl, 'Avatar URL should have been returned')

    let verifiedAccounts = personObject.verifiedAccounts([])
    t.ok(verifiedAccounts, 'Verified accounts should have been returned')
    t.equal(verifiedAccounts.length, 0, 'Verified accounts should match the expected value')

    let address = personObject.address()
    t.ok(address, 'Address should have been returned')

    let birthDate = personObject.birthDate()
    t.ok(birthDate, 'Birth date should have been returned')

    let connections = personObject.connections()
    t.ok(connections, 'Connections should have been returned')

    let organizations = personObject.organizations()
    t.ok(organizations, 'Organizations should have been returned')
  })

  test('legacyFormat', (t) => {
    t.plan(2)

    let profileObject = Person.fromLegacyFormat(sampleProfiles.navalLegacy)
    t.ok(profileObject, 'Profile object should have been created from legacy formatted profile')

    let validationResults = Person.validateSchema(profileObject.toJSON(), true)
    t.ok(validationResults, 'Profile should be in a valid format')
  })

  test('resolveZoneFileToPerson', (t) => {
    t.plan(2)

    let zoneFile = "$ORIGIN ryan.id\n$TTL 3600\n_http._tcp IN URI 10 1 \"https://blockstack.s3.amazonaws.com/ryan.id\"\n"
    let ownerAddress = "19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk"
    FetchMock.get(sampleTokenFiles.ryan.url, sampleTokenFiles.ryan.body)

    resolveZoneFileToPerson(zoneFile, ownerAddress, (profile) => {
      t.ok(profile, 'Profile was extracted')
      t.equal(profile.name, "Ryan Shea", 'The profile was recovered with the expected value of the name field')
    })
  })

  test('profileLookUp', (t) => {
    t.plan(2)

    const name = 'ryan.id'
    const zoneFileLookupURL = 'http://localhost:6270/v1/names/'

    const mockZonefile = {
      "zonefile": "$ORIGIN ryan.id\n$TTL 3600\n_http._tcp IN URI 10 1 \"https://blockstack.s3.amazonaws.com/ryan.id\"\n", 
      "address": "19MoWG8u88L6t766j7Vne21Mg4wHsCQ7vk", 
    }

    FetchMock.get('http://localhost:6270/v1/names/ryan.id', mockZonefile)
    FetchMock.get(sampleTokenFiles.ryan.url, sampleTokenFiles.ryan.body)

    lookupProfile(name, zoneFileLookupURL)
      .then((profile) => {
        t.ok(profile, 'zonefile resolves to profile')
        t.equal(profile.name, "Ryan Shea", 'The profile was recovered with the expected value of the name field')
      })
  })
}

export function runProfilesUnitTests() {
  testVerifyToken()
  testTokening('naval.json', sampleProfiles.naval)
  testTokening('google.json', sampleProfiles.google)
  testTokening('balloonDog.json', sampleProfiles.balloonDog)
  testZoneFile()
  testSchemas()
}
