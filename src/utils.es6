'use strict'

/**
 * Time
 */

export function nextYear() {
  return new Date(new Date().setFullYear(new Date().getFullYear() + 1))
}

/**
 * Entropy
 */

import { randomBytes } from 'crypto'

export function getEntropy(numberOfBytes) {
  if (!numberOfBytes) {
    numberOfBytes = 32
  }
  return randomBytes(numberOfBytes)
}

/**
 * Elliptic Curve Keys
 */

import BigInteger from 'bigi'
import { ECPair as ECKeyPair } from 'bitcoinjs-lib'

export function privateKeyToPublicKey(privateKey) {
  const privateKeyBuffer = new Buffer(privateKey, 'hex')
  const privateKeyBigInteger = BigInteger.fromBuffer(privateKeyBuffer)
  const keyPair = new ECKeyPair(privateKeyBigInteger, null, {})
  const publicKey = keyPair.getPublicKeyBuffer().toString('hex')
  return publicKey
}

/**
 * UUIDs
 */

export function generateUUID4 () {
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}