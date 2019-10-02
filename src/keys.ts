
import { ECPair, address as baddress } from 'bitcoinjs-lib'
import { randomBytes } from './encryption/cryptoRandom'
import { createHashSha256 } from './encryption/hashSha256'
import { createHashRipemd160 } from './encryption/hashRipemd160'

/**
 * 
 * @param numberOfBytes 
 * 
 * @ignore
 */
export function getEntropy(arg: number): Buffer {
  if (!arg) {
    arg = 32
  }
  return randomBytes(arg)
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
export async function publicKeyToAddress(publicKey: string) {
  const publicKeyBuffer = Buffer.from(publicKey, 'hex')
  const publicKeyHash160 = await createHashRipemd160().digest(
    await createHashSha256().digest(publicKeyBuffer)
  )
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
