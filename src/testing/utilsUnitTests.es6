import test from 'tape'
import fs from 'fs'
import {
  containsValidProofStatement
} from '../utils'

const sampleVerifications = {

  naval: {
    github: fs.readFileSync('./docs/profiles/naval.verification.github.html','utf8')
  }

}


export function runUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(2)
    t.equal(containsValidProofStatement(sampleVerifications.naval.github, 'naval'),
    true, "Should contain valid proof statement for +naval")
    t.equal(containsValidProofStatement(sampleVerifications.naval.github, 'larry'),
    false, "Should not contain valid proof statement for +larry")
  })
}
