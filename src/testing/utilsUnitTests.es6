import test from 'tape'
import fs from 'fs'
import {
  containsValidProofStatement
} from '../utils'
import { sampleVerifications } from './samples'


export function runUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(7)
    t.equal(containsValidProofStatement(sampleVerifications.naval.facebook.body, 'naval'),
    true, "Facebook post body should contain valid proof statement for +naval")
    t.equal(containsValidProofStatement(sampleVerifications.naval.github.body, 'naval'),
    true, "Github gist post body should contain valid proof statement for +naval")
    t.equal(containsValidProofStatement(sampleVerifications.naval.twitter.body, 'naval'),
    true, "Twitter post body should contain valid proof statement for +naval")

    t.equal(containsValidProofStatement(sampleVerifications.naval.facebook.body, 'larry'),
    false, "Github gist post body should not contain valid proof statement for +larry")
    t.equal(containsValidProofStatement(sampleVerifications.naval.github.body, 'larry'),
    false, "Github gist post body should not contain valid proof statement for +larry")
    t.equal(containsValidProofStatement(sampleVerifications.naval.twitter.body, 'larry'),
    false, "Github gist post body should not contain valid proof statement for +larry")

    t.equal(containsValidProofStatement(sampleVerifications.larry.facebook.body, 'larry'),
    true, "Facebook post body should contain valid proof statement for +larry")
  })
}
