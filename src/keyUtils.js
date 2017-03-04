'use strict'

import BigInteger from 'bigi'
import { ECPair as ECKeyPair } from 'bitcoinjs-lib'

export function privateKeyToPublicKey(privateKey) {
  const privateKeyBuffer = new Buffer(privateKey, 'hex')
  const privateKeyBigInteger = BigInteger.fromBuffer(privateKeyBuffer)
  const keyPair = new ECKeyPair(privateKeyBigInteger, null, {})
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex')
  return publicKey
}