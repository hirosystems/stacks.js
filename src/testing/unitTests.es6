import test from 'tape'
import fs from 'fs'
import { PrivateKeychain, PublicKeychain } from 'elliptic-keychain'
import {
  signProfileTokens, getProfileFromTokens, validateTokenRecord, Zonefile,
  Profile, Person, Organization, CreativeWork
} from '../index'

let privateKeychain = new PrivateKeychain(),
    publicKeychain = privateKeychain.publicKeychain()

let sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync('./docs/profiles/balloonDog.json')),
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.json')),
  google: JSON.parse(fs.readFileSync('./docs/profiles/google.json'))
}

function testTokening(profile) {
  let tokenRecords = []

  test('profileToTokens', function(t) {
    t.plan(2)

    tokenRecords = signProfileTokens([profile], privateKeychain)
    t.ok(tokenRecords, 'Tokens should have been created')
    //console.log(JSON.stringify(tokenRecords, null, 2))

    let tokensVerified = true
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

    let recoveredProfile = getProfileFromTokens(tokenRecords, publicKeychain)
    //console.log(recoveredProfile)
    t.ok(recoveredProfile, 'Profile should have been reconstructed')
    t.equal(JSON.stringify(recoveredProfile), JSON.stringify(profile), 'Profile should equal the reference')
  })
}

function testZonefile() {
  let zonefileJsonReference = JSON.parse(fs.readFileSync('./docs/zonefiles/zonefile1.json')),
      zonefileStringReference = fs.readFileSync('./docs/zonefiles/zonefile1.txt', 'utf-8')

  test('zonefileFromJson', function(t) {
    t.plan(5)

    let zonefile = new Zonefile(zonefileJsonReference)
    t.ok(zonefile, 'Zonefile object should have been created')

    let zonefileJson = zonefile.toJSON()
    t.ok(zonefileJson, 'Zonefile JSON should have been created')
    t.equal(JSON.stringify(zonefileJson), JSON.stringify(zonefileJsonReference), 'Zonefile JSON should match the reference')

    let zonefileString = zonefile.toString()
    t.ok(zonefileString, 'Zonefile text should have been created')
    t.equal(zonefileString.split('; NS Records')[1], zonefileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  })

  test('zonefileFromString', function(t) {
    t.plan(5)

    let zonefile = new Zonefile(zonefileStringReference)
    t.ok(zonefile, 'Zonefile object should have been created')

    let zonefileJson = zonefile.toJSON()
    t.ok(zonefileJson, 'Zonefile JSON should have been created')
    t.equal(JSON.stringify(zonefileJson), JSON.stringify(zonefileJsonReference), 'Zonefile JSON should match the reference')

    let zonefileString = zonefile.toString()
    t.ok(zonefileString, 'Zonefile text should have been created')
    t.equal(zonefileString.split('; NS Records')[1], zonefileStringReference.split('; NS Records')[1], 'Zonefile text should match the reference')
  })
}

function testSchemas() {
  test('Profile', function(t) {
    t.plan(5)

    let profileObject = new Profile(sampleProfiles.naval)
    t.ok(profileObject, 'Profile object should have been created')

    let validationResults = Profile.validate(sampleProfiles.naval)
    t.ok(validationResults.valid, 'Profile should be valid')

    let profileJson = profileObject.toJSON()
    t.ok(profileJson, 'Profile JSON should have been created')  

    let profileTokens = profileObject.toSignedTokens(privateKeychain)
    t.ok(profileTokens, 'Profile tokens should have been created')
  
    let profileObject2 = Profile.fromTokens(profileTokens, publicKeychain)
    t.ok(profileObject2, 'Profile should have been reconstructed from tokens')
  })

  test('Person', function(t) {
    t.plan(4)

    let personObject = new Person(sampleProfiles.naval)
    t.ok(personObject, 'Person object should have been created')

    let validationResults = Person.validate(sampleProfiles.naval)
    t.ok(validationResults.valid, 'Person profile should be valid')

    let profileTokens = personObject.toSignedTokens(privateKeychain)
    t.ok(profileTokens, 'Person profile tokens should have been created')

    let profileObject2 = Person.fromTokens(profileTokens, publicKeychain)
    t.ok(profileObject2, 'Person profile should have been reconstructed from tokens')
  })
}

testTokening(sampleProfiles.naval)
testTokening(sampleProfiles.google)
testTokening(sampleProfiles.balloonDog)
testZonefile()
testSchemas()
