import test from 'tape'
import fs from 'fs'
import {
  containsValidProofStatement
} from '../utils'
import { sampleVerifications } from './samples'


export function runUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(7)
    t.equal(containsValidProofStatement(sampleVerifications.naval.facebook.body, 'naval.id'),
    true, "Facebook post body should contain valid proof statement for naval.id")
    t.equal(containsValidProofStatement(sampleVerifications.naval.github.body, 'naval.id'),
    true, "Github gist post body should contain valid proof statement for naval.id")
    t.equal(containsValidProofStatement(sampleVerifications.naval.twitter.body, 'naval.id'),
    true, "Twitter post body should contain valid proof statement for naval.id")

    t.equal(containsValidProofStatement(sampleVerifications.naval.facebook.body, 'larry.id'),
    false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(containsValidProofStatement(sampleVerifications.naval.github.body, 'larry.id'),
    false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(containsValidProofStatement(sampleVerifications.naval.twitter.body, 'larry.id'),
    false, "Github gist post body should not contain valid proof statement for larry.id")

    t.equal(containsValidProofStatement(sampleVerifications.larry.facebook.body, 'larry.id'),
    true, "Facebook post body should contain valid proof statement for larry.id")
  })
}
