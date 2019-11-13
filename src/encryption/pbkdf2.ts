import { pbkdf2 as pbkdf2Polyfill } from 'pbkdf2'
import { getCryptoLib } from './cryptoUtils'

export type Pbkdf2Digests = 'sha512' | 'sha256'

export interface Pbkdf2 {
  derive(
    password: string, 
    salt: Buffer,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): Promise<Buffer>;
}

type NodePbkdf2Fn = typeof import('crypto').pbkdf2

export class NodeCryptoPbkdf2 implements Pbkdf2 {
  nodePbkdf2: NodePbkdf2Fn

  constructor(nodePbkdf2: NodePbkdf2Fn) {
    this.nodePbkdf2 = nodePbkdf2
  }

  async derive(
    password: string, 
    salt: Buffer,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): 
    Promise<Buffer> {
    if (digest !== 'sha512' && digest !== 'sha256') {
      throw new Error(`Unsupported digest "${digest}" for Pbkdf2`)
    }
    return new Promise((resolve, reject) => {
      this.nodePbkdf2(password, salt, iterations, keyLength, digest, (error, result) => {
        if (error) {
          reject(error)
        }
        resolve(result)
      })
    })
  }
}

export class PolyfillLibPbkdf2 implements Pbkdf2 {
  // TODO: Create an async implementation for browsers that support 
  //       WebCrypto hash & hmac but not pbkdf2, rather than dependent on the 
  //       extremely slow `pbkdf2` lib implementation. 
  async derive(
    password: string, 
    salt: Buffer,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): 
    Promise<Buffer> {
    if (digest !== 'sha512' && digest !== 'sha256') {
      throw new Error(`Unsupported digest "${digest}" for Pbkdf2`)
    }
    const passwordBytes = Buffer.from(password, 'utf8')
    return new Promise((resolve, reject) => {
      pbkdf2Polyfill(
        passwordBytes, salt, iterations, 
        keyLength, digest, (error, derivedKey) => {
          if (error) {
            reject(error)
          } else {
            resolve(derivedKey)
          }
        }
      )
    })
  }
}

export class WebCryptoPbkdf2 implements Pbkdf2 {
  subtleCrypto: SubtleCrypto

  constructor(subtleCrypto: SubtleCrypto) {
    this.subtleCrypto = subtleCrypto
  }

  async derive(
    password: string, 
    salt: Buffer,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): 
    Promise<Buffer> {
    let algo: string
    if (digest === 'sha256') {
      algo = 'SHA-256'
    } else if (digest === 'sha512') {
      algo = 'SHA-512'
    } else {
      throw new Error(`Unsupported Pbkdf2 digest algorithm "${digest}"`)
    }
    let result: ArrayBuffer
    const passwordBytes = Buffer.from(password, 'utf8')
    try {
      const key = await this.subtleCrypto.importKey(
        'raw', passwordBytes, 'PBKDF2', false, ['deriveBits']
      )
      result = await this.subtleCrypto.deriveBits({
        name: 'PBKDF2', salt, iterations, hash: { name: algo }
      }, key, keyLength * 8)
    } catch (error) {
      const libPolyfill = new PolyfillLibPbkdf2()
      return libPolyfill.derive(password, salt, iterations, keyLength, digest)
    }
    return Buffer.from(result)
  }
}

export async function createPbkdf2(): Promise<Pbkdf2> {
  const cryptoLib = await getCryptoLib()
  if (cryptoLib.name === 'subtleCrypto') {
    return new WebCryptoPbkdf2(cryptoLib.lib)
  } else {
    return new NodeCryptoPbkdf2(cryptoLib.lib.pbkdf2)
  }
}

