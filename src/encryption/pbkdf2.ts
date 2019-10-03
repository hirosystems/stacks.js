// eslint-disable-next-line import/no-nodejs-modules
import { pbkdf2Sync } from 'crypto'
import { Pbkdf2, Pbkdf2Digests } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodePbkdf2 implements Pbkdf2 {
  async derive(
    password: string, 
    salt: NodeJS.TypedArray,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): 
    Promise<Buffer> {
    if (digest !== 'sha512' && digest !== 'sha256') {
      throw new Error(`Unsupported digest "${digest}" for Pbkdf2`)
    }
    const result = pbkdf2Sync(password, salt, iterations, keyLength, digest)
    return Promise.resolve(result)
  }
}

export function createPbkdf2(): Pbkdf2 {
  return new NodePbkdf2()
}

