import test from 'tape'
import fs from 'fs'
import { PrivateKeychain, PublicKeychain } from 'blockstack-keychains'
import {
  signToken, wrapToken, signTokenRecords,
  verifyToken, verifyTokenRecord, getProfileFromTokens,
  Profile, Person, Organization, CreativeWork,
  makeZoneFileForHostedProfile
} from '../index'

let privateKeychain = new PrivateKeychain(),
    publicKeychain = privateKeychain.publicKeychain()

const sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync('./docs/profiles/balloonDog.json')),
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.json')),
  google: JSON.parse(fs.readFileSync('./docs/profiles/google.json')),
  navalLegacy: JSON.parse(fs.readFileSync('./docs/profiles/naval-legacy.json'))
}
const sampleTokenFiles = {
  ryan_apr20: JSON.parse(fs.readFileSync('./docs/testTokenFiles/ryan_apr20.json'))
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

function testVerifyToken() {
  const tokenFile = sampleTokenFiles.ryan_apr20,
        token = tokenFile[0].token

  const publicKey = "02413d7c51118104cfe1b41e540b6c2acaaf91f1e2e22316df7448fb6070d582ec",
        compressedAddress = "1BTku19roxQs2d54kbYKVTv21oBCuHEApF",
        uncompressedAddress = "12wes6TQpDF2j8zqvAbXV9KNCGQVF2y7G5"

  test('verifyToken', (t) => {
    t.plan(3)

    let decodedToken1 = verifyToken(token, publicKey)
    t.ok(decodedToken1, 'Token should have been verified against a public key')

    let decodedToken2 = verifyToken(token, compressedAddress)
    t.ok(decodedToken2, 'Token should have been verified against a compressed address')

    let decodedToken3 = verifyToken(token, uncompressedAddress)
    t.ok(decodedToken3, 'Token should have been verified against an uncompressed address')
  })
}

function testZoneFile() {
  test('makeZoneFileForHostedProfile', (t) => {
    t.plan(1)
    
    let fileUrl = 'https://mq9.s3.amazonaws.com/naval.id/profile.json'
    let zoneFile = makeZoneFileForHostedProfile('naval.id', fileUrl)
    //console.log(zoneFile)
    t.ok(zoneFile, 'Zone file should have been created for hosted profile')
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
    t.plan(18)

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
}

testVerifyToken()
testTokening('naval.json', sampleProfiles.naval)
testTokening('google.json', sampleProfiles.google)
testTokening('balloonDog.json', sampleProfiles.balloonDog)
testZoneFile()
testSchemas()
