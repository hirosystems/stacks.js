import { SECP256K1Client } from 'jsontokens'
import {
  getEntropy, 
  makeECPrivateKey, 
  publicKeyToAddress,
  ecPairToHexString, 
  hexStringToECPair, 
  ecPairToAddress
} from '../src'

test('makeECPrivateKey', () => {
  const entropy = getEntropy(32)
  expect(entropy).toBeTruthy()

  const privateKey = makeECPrivateKey()
  expect(privateKey).toBeTruthy()
  expect(typeof privateKey).toEqual('string')

  const publicKey = SECP256K1Client.derivePublicKey(privateKey)

  const address = publicKeyToAddress(publicKey)
  expect(address).toBeTruthy()
  expect(typeof address).toEqual('string')
})

test('ecPairToHexString', () => {
  const privateKey = '00cdce6b5f87d38f2a830cae0da82162e1b487f07c5affa8130f01fe1a2a25fb01'
  const expectedAddress = '1WykMawQRnLh7SWmmoRL4qTDNCgAsVRF1'

  const computedECPair = hexStringToECPair(privateKey)
  expect(privateKey).toEqual(ecPairToHexString(computedECPair))
  expect(expectedAddress).toEqual(ecPairToAddress(computedECPair))
})

