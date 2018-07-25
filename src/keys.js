/* @flow */
import { randomBytes } from 'crypto'
import { ECPair, address as baddress, crypto as bcrypto } from 'bitcoinjs-lib'
import bigi from 'bigi'

export function getEntropy(numberOfBytes: number) {
  if (!numberOfBytes) {
    numberOfBytes = 32
  }
  return randomBytes(numberOfBytes)
}

export function makeECPrivateKey() {
  const keyPair = new ECPair.makeRandom({ rng: getEntropy })
  return keyPair.d.toBuffer(32).toString('hex')
}

export function publicKeyToAddress(publicKey: string) {
  const publicKeyBuffer = new Buffer(publicKey, 'hex')
  const publicKeyHash160 = bcrypto.hash160(publicKeyBuffer)
  const address = baddress.toBase58Check(publicKeyHash160, 0x00)
  return address
}

export function getPublicKeyFromPrivate(privateKey: string) {
  const keyPair = new ECPair(bigi.fromHex(privateKey))
  return keyPair.getPublicKeyBuffer().toString('hex')
}
