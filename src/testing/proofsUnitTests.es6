import test from 'blue-tape'
import fs from 'fs'
import {
  validateProofs
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
    return validateProofs(profile, username).then((proofs) => {
      t.ok(proofs, 'Proofs must have been created')
      t.equal(proofs instanceof Array, true, "Proofs should be an Array")
      t.equal(proofs.length, 3, "Should have a proof for each of the 3 claimed accounts")
    })
  })

}

export function runProofsUnitTests() {
  testProofs(sampleProfiles.naval, "naval")
}
