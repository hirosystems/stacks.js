import test from 'tape'
import fs from 'fs'
import { containsValidProofStatement } from '../services'
import { sampleVerifications } from './sampleData'

export function runUtilsUnitTests() {
  test('containsValidProofStatement', (t) => {
    t.plan(8)

    const naval = sampleVerifications.naval

    t.equal(
        containsValidProofStatement(naval.facebook.body, 'naval.id'),
        true, "Facebook post body should contain valid proof statement for naval.id")
    t.equal(
        containsValidProofStatement(naval.github.body, 'naval.id'),
        true, "Github gist post body should contain valid proof statement for naval.id")
    t.equal(
        containsValidProofStatement(naval.twitter.body, 'naval.id'),
        true, "Twitter post body should contain valid proof statement for naval.id")

    const larry = sampleVerifications.larry

    t.equal(
        containsValidProofStatement(naval.facebook.body, 'larry.id'),
        false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(
        containsValidProofStatement(naval.github.body, 'larry.id'),
        false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(
        containsValidProofStatement(naval.twitter.body, 'larry.id'),
        false, "Github gist post body should not contain valid proof statement for larry.id")
    t.equal(
        containsValidProofStatement(larry.facebook.body, 'larry.id'),
        true, "Facebook post body should contain valid proof statement for larry.id")

    t.throws(
        () => { containsValidProofStatement(larry.facebook.body, 'larry') },
        /Error/, "Using non-fully qualified blockstack name should throw exception")
  })
}
