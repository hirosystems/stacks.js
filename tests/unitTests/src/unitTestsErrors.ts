import * as test from 'tape-promise/tape'

import { InvalidDIDError } from '../../../src/errors'

export function runErrorsTests() {
  test('InvalidDIDError', (t) => {
    t.plan(3)
    const error = new InvalidDIDError('the message')

    t.equal(error.message, 'the message')
    t.equal(error.parameter, null)
    t.equal((<any>error).param, undefined)
  })
}
