import { getCryptoLib } from './cryptoUtils'

export type Pbkdf2Digests = 'sha512' | 'sha256'

export interface Pbkdf2 {
  derive(
    password: string, 
    salt: NodeJS.TypedArray,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): Promise<Buffer>;
}

type NodePbkdf2Fn = typeof import('crypto').pbkdf2

class NodeCryptoPbkdf2 implements Pbkdf2 {
  pbkdf2: NodePbkdf2Fn

  constructor(pbkdf2: NodePbkdf2Fn) {
    this.pbkdf2 = pbkdf2
  }

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
    return new Promise((resolve, reject) => {
      this.pbkdf2(password, salt, iterations, keyLength, digest, (error, result) => {
        if (error) {
          reject(error)
        }
        resolve(result)
      })
    })
  }
}

class WebCryptoPbkdf2 implements Pbkdf2 {
  subtleCrypto: SubtleCrypto

  constructor(subtleCrypto: SubtleCrypto) {
    this.subtleCrypto = subtleCrypto
  }

  async derive(
    password: string, 
    salt: NodeJS.TypedArray,
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
    const passwordBytes = Buffer.from(password)
    const key = await this.subtleCrypto.importKey(
      'raw', passwordBytes, 'PBKDF2', false, ['deriveBits']
    )
    const result = await this.subtleCrypto.deriveBits({
      name: 'PBKDF2', salt, iterations, hash: { name: algo }
    }, key, keyLength << 3)
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

