import test from 'tape'
import fs from 'fs'
import { PrivateKeychain, PublicKeychain } from 'blockstack-keychain'
import {
  signToken, wrapToken, signTokenRecords,
  getProfileFromTokens, verifyTokenRecord,
  Profile, Person, Organization, CreativeWork,
  prepareZoneFileForHostedFile
} from '../index'

let privateKeychain = new PrivateKeychain(),
    publicKeychain = privateKeychain.publicKeychain()

let sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync('./docs/profiles/balloonDog.json')),
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.json')),
  google: JSON.parse(fs.readFileSync('./docs/profiles/google.json')),
  navalLegacy: JSON.parse(fs.readFileSync('./docs/profiles/naval-legacy.json'))
}

function testTokening(filename, profile) {
  let tokenRecords = []

  test('profileToToken', (t) => {
    t.plan(3)

    let privateKey = privateKeychain.privateKey('hex'),
        publicKey = publicKeychain.publicKey('hex')

    let token = signToken(profile, privateKey, {publicKey: publicKey})
    t.ok(token, 'Token must have been created')
    let tokenRecord = wrapToken(token)
    t.ok(tokenRecord, 'Token record must have been created')

    let decodedToken = verifyTokenRecord(tokenRecord, publicKey)
    t.ok(decodedToken, 'Token record must have been verified')
  })

  test('profileToTokens', (t) => {
    t.plan(2)

    tokenRecords = signTokenRecords([profile], privateKeychain)
    t.ok(tokenRecords, 'Tokens should have been created')
    //console.log(JSON.stringify(tokenRecords, null, 2))
    fs.writeFileSync('./docs/tokenfiles/' + filename, JSON.stringify(tokenRecords, null, 2))

    let tokensVerified = true
    tokenRecords.map((tokenRecord) => {
      let decodedToken = verifyTokenRecord(tokenRecord, publicKeychain)
    })
    t.equal(tokensVerified, true, 'All tokens should be valid')
  })

  test('tokensToProfile', (t) => {
    t.plan(2)

    let recoveredProfile = getProfileFromTokens(tokenRecords, publicKeychain)
    //console.log(recoveredProfile)
    t.ok(recoveredProfile, 'Profile should have been reconstructed')
    t.equal(JSON.stringify(recoveredProfile), JSON.stringify(profile), 'Profile should equal the reference')
  })
}

function testZoneFile() {
  test('prepareForHostedFile', (t) => {
    t.plan(1)
    
    let fileUrl = 'https://mq9.s3.amazonaws.com/naval.id/profile.json'
    let zoneFile = prepareZoneFileForHostedFile('naval.id', fileUrl)
    //console.log(zoneFile)
    t.ok(zoneFile, 'Zone file should have been prepared for hosted file')
  })
}

function testSchemas() {
  test('Profile', (t) => {
    t.plan(5)

    let profileObject = new Profile(sampleProfiles.naval)
    t.ok(profileObject, 'Profile object should have been created')

    let validationResults = Profile.validateSchema(sampleProfiles.naval)
    t.ok(validationResults.valid, 'Profile should be valid')

    let profileJson = profileObject.toJSON()
    t.ok(profileJson, 'Profile JSON should have been created')  

    let tokenRecords = profileObject.toSignedTokens(privateKeychain)
    t.ok(tokenRecords, 'Profile tokens should have been created')
    
    let profileObject2 = Profile.fromTokens(tokenRecords, publicKeychain)
    t.ok(profileObject2, 'Profile should have been reconstructed from tokens')
  })

  test('Person', (t) => {
    t.plan(4)

    let personObject = new Person(sampleProfiles.naval)
    t.ok(personObject, 'Person object should have been created')

    let validationResults = Person.validateSchema(sampleProfiles.naval, true)
    t.ok(validationResults.valid, 'Person profile should be valid')

    let standaloneProperties = ['taxID', 'birthDate', 'address']
    let tokenRecords = personObject.toSignedTokens(privateKeychain, standaloneProperties)
    t.ok(tokenRecords, 'Person profile tokens should have been created')
    fs.writeFileSync('./docs/tokenfiles/naval-4-tokens.json', JSON.stringify(tokenRecords, null, 2))

    let profileObject2 = Person.fromTokens(tokenRecords, publicKeychain)
    t.ok(profileObject2, 'Person profile should have been reconstructed from tokens')
  })

  test('legacyFormat', (t) => {
    t.plan(2)

    let profileObject = Person.fromLegacyFormat(sampleProfiles.navalLegacy)
    t.ok(profileObject, 'Profile object should have been created from legacy formatted profile')

    let validationResults = Person.validateSchema(profileObject.toJSON(), true)
    t.ok(validationResults, 'Profile should be in a valid format')
  })
}

testTokening('naval.json', sampleProfiles.naval)
testTokening('google.json', sampleProfiles.google)
testTokening('balloonDog.json', sampleProfiles.balloonDog)
testZoneFile()
testSchemas()
