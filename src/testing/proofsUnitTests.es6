import test from 'blue-tape'
import fs from 'fs'
import FetchMock from 'fetch-mock'
import {
  validateProofs
} from '../index'
import { sampleProfiles, sampleProofs, sampleVerifications } from './samples'


function testProofs(profile, username) {
  mockRequests()

  test('Profiles', (t) => {
    return validateProofs(profile, username).then((proofs) => {
      t.ok(proofs, 'Proofs must have been created')
      t.equal(proofs instanceof Array, true, "Proofs should be an Array")
      t.equal(proofs.length, 3, "Should have a proof for each of the 3 claimed accounts")
      FetchMock.restore()
    })
  })

}



function mockRequests() {
  FetchMock.get(sampleVerifications.naval.facebook.url, sampleVerifications.naval.facebook.body)
  FetchMock.get(sampleVerifications.naval.github.url, sampleVerifications.naval.github.body)
  FetchMock.get(sampleVerifications.naval.twitter.url, sampleVerifications.naval.twitter.body)
}


export function runProofsUnitTests() {
  testProofs(sampleProfiles.naval, "naval")
}
