'use strict'

import { randomBytes } from 'crypto'
import { ECPair } from 'bitcoinjs-lib'

export function getEntropy(numberOfBytes) {
  if (!numberOfBytes) {
    numberOfBytes = 32
  }
  return randomBytes(numberOfBytes)
}

export function makeECPrivateKey() {
  const keyPair = new ECPair.makeRandom({ rng: getEntropy })
  return keyPair.d.toBuffer(32).toString('hex')
}

export function publicKeyToAddress(publicKey) {
  const publicKeyBuffer = new Buffer(publicKey, 'hex')
  const keyPair = ECPair.fromPublicKeyBuffer(publicKeyBuffer)
  return keyPair.getAddress()
}