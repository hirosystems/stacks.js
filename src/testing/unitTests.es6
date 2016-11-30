'use strict'

import test from 'tape'
import fs from 'fs'
import {
  profileToProofs
} from '../index'


const sampleProfiles = {
  balloonDog: JSON.parse(fs.readFileSync('./docs/profiles/balloonDog.json')),
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.json')),
  google: JSON.parse(fs.readFileSync('./docs/profiles/google.json')),
  navalLegacy: JSON.parse(fs.readFileSync('./docs/profiles/naval-legacy.json'))
}

const sampleProofs = {
  naval: JSON.parse(fs.readFileSync('./docs/profiles/naval.proofs.json')),
}


function testProofs(profile, username) {
  test('Profiles', (t) => {
    t.plan(3)

    let proofs = profileToProofs(profile, username)
    t.ok(proofs, 'Proofs must have been created')
    t.equal(proofs instanceof Array, true, "Proofs should be an Array")
    t.equal(proofs.length, 3, "Should have a proof for each of the 3 claimed accounts")
    
  })

}

testProofs(sampleProfiles.naval, "naval")
