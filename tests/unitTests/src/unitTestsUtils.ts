import * as test from 'tape-promise/tape'
import { SECP256K1Client } from 'jsontokens'
import {
  getEntropy, makeECPrivateKey, publicKeyToAddress, isSameOriginAbsoluteUrl,
  ecPairToHexString, hexStringToECPair, ecPairToAddress, isLaterVersion
} from '../../../src'

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

  test('ecPairToHexString', (t) => {
    t.plan(2)

    const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01'
    const expectedAddress = '1WykMawQRnLh7SWmmoRL4qTDNCgAsVRF1'

    const computedECPair = hexStringToECPair(privateKey)
    t.equal(privateKey, ecPairToHexString(computedECPair), 'Should return same hex string')

    t.equal(expectedAddress, ecPairToAddress(computedECPair), 'Should parse to correct address')
  })

  test('isLaterVersion', (t) => {
    t.plan(4)
    t.false(isLaterVersion(undefined, '1.1.0'), 'undefined version is not later than 1.1.0')
    t.true(isLaterVersion('1.2.0', '1.1.0'), '1.2.0 version is later than 1.1.0')
    t.true(isLaterVersion('1.1.0', '1.1.0'), '1.1.0 version is later than 1.1.0')
    t.false(isLaterVersion('1.1.0', '1.2.0'), '1.1.0 version is later than 1.2.0')
  })

  test('isSameOriginAbsoluteUrl', (t) => {
    t.plan(12)
    t.true(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com/manifest.json'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('https://example.com', 'https://example.com/manifest.json'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('http://localhost:3000', 'http://localhost:3000/manifest.json'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('http://app.example.com', 'http://app.example.com/manifest.json'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('http://app.example.com:80', 'http://app.example.com/manifest.json'), 'should be same origin')
    t.true(isSameOriginAbsoluteUrl('https://app.example.com:80', 'https://app.example.com:80/manifest.json'), 'should be same origin')

    t.false(isSameOriginAbsoluteUrl('http://example.com', 'https://example.com/'), 'should not be same origin')
    t.false(isSameOriginAbsoluteUrl('http://example.com', 'http://example.com:1234'), 'should not be same origin')
    t.false(isSameOriginAbsoluteUrl('http://app.example.com', 'https://example.com/manifest.json'), 'should not be same origin')
    t.false(isSameOriginAbsoluteUrl('http://app.example.com', '/manifest.json'), 'should not be same origin')
  })
}
