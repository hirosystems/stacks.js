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

function testProofs(profile, username) {
  test('Profiles', (t) => {
    t.plan(1)

    let proofs = profileToProofs(profile, username)
    
    t.ok(true)
  })

}

testProofs(sampleProfiles.naval, "naval")
