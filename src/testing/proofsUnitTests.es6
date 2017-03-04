import test from 'blue-tape'
import fs from 'fs'
import FetchMock from 'fetch-mock'
import { validateProofs } from '../index'
import { sampleProfiles, sampleProofs, sampleVerifications } from './sampleData'

function testProofs(profile, username, totalProofs) {
  mockRequests()

  test('Profiles', (t) => {
    return validateProofs(profile, username).then((proofs) => {
      t.ok(proofs, 'Proofs must have been created')
      t.equal(proofs instanceof Array, true, "Proofs should be an Array")
      t.equal(proofs.length, totalProofs, "Should have a proof for each of the 3 claimed accounts")
      FetchMock.restore()
    })
  })
}

function mockRequests() {
  const naval = sampleVerifications.naval
  const larry = sampleVerifications.larry

  FetchMock.get(naval.facebook.url, naval.facebook.body)
  FetchMock.get(naval.github.url, naval.github.body)
  FetchMock.get(naval.twitter.url, naval.twitter.body)
  FetchMock.get(larry.facebook.url, larry.facebook.body)
}

export function runProofsUnitTests() {
  testProofs(sampleProfiles.naval, "naval.id", 3)
  testProofs(sampleProfiles.larry, "larry.id", 1)
}