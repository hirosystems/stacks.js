
import { randomBytes, randomFillSync } from 'crypto'
import { ECPair, address as baddress, crypto as bcrypto } from 'bitcoinjs-lib'

/**
 * 
 * @param numberOfBytes 
 * 
 * @ignore
 */
export function getEntropy(arg: Buffer | number): Buffer {
  if (!arg) {
    arg = 32
  }
  if (typeof arg === 'number') {
    return randomBytes(arg)
  } else {
    return randomFillSync(arg)
  }  
}

/**
* @ignore
*/
export function makeECPrivateKey() {
  const keyPair = ECPair.makeRandom({ rng: getEntropy })
  return keyPair.privateKey.toString('hex')
}

/**
* @ignore
*/
export function publicKeyToAddress(publicKey: string) {
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const publicKeyHash160 = bcrypto.hash160(publicKeyBuffer)
  const address = baddress.toBase58Check(publicKeyHash160, 0x00)
  return address
}

/**
* @ignore
*/
export function getPublicKeyFromPrivate(privateKey: string) {
  const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'))
  return keyPair.publicKey.toString('hex')
}
