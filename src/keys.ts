
import { ECPair, address as baddress } from 'bitcoinjs-lib'
import { randomBytes } from './encryption/cryptoRandom'
import { createSha2Hash } from './encryption/sha2Hash'
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
export async function publicKeyToAddress(publicKey: string | Buffer) {
  const publicKeyBuffer = Buffer.isBuffer(publicKey) ? publicKey : Buffer.from(publicKey, 'hex')
  const sha2Hash = await createSha2Hash()
  const publicKeyHash160 = await createHashRipemd160().digest(
    await sha2Hash.digest(publicKeyBuffer)
  )
  const address = baddress.toBase58Check(publicKeyHash160, 0x00)
  return address
}

/**
* @ignore
*/
export function getPublicKeyFromPrivate(privateKey: string | Buffer) {
  const privateKeyBuffer = Buffer.isBuffer(privateKey) ? privateKey : Buffer.from(privateKey, 'hex')
  const keyPair = ECPair.fromPrivateKey(privateKeyBuffer)
  return keyPair.publicKey.toString('hex')
}
