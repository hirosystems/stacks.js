'use strict'

//import test from 'tape'
import test from 'tape-promise/tape'
import { SECP256K1Client } from 'jsontokens'
import {
  getEntropy, makeECPrivateKey, publicKeyToAddress
} from '../../../lib'

export function runUtilsTests() {
  test('makeECPrivateKey', (t) => {
    t.plan(5)

    const entropy = getEntropy(32)
    t.ok(entropy, 'Entropy should have been created')

    const privateKey = makeECPrivateKey()
    t.ok(privateKey, 'Private key should have been created')
    t.equal(typeof privateKey, 'string', 'Private key should be a string')

    const publicKey = SECP256K1Client.derivePublicKey(privateKey)

    const address = publicKeyToAddress(publicKey)
    t.ok(address, 'Address should have been created')
    t.equal(typeof address, 'string', 'Address should be a string')
  })
}