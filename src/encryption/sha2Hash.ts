
import { isWebCryptoAvailable, NO_CRYPTO_LIB } from './cryptoUtils'

type NodeCryptoCreateHash = typeof import('crypto').createHash

export interface Sha2Hash {
  digest(data: NodeJS.TypedArray, algorithm?: 'sha256' | 'sha512'): Promise<Buffer>;
}

class NodeCryptoSha2Hash {
  createHash: NodeCryptoCreateHash

  constructor(createHash: NodeCryptoCreateHash) {
    this.createHash = createHash
  }

  async digest(data: NodeJS.TypedArray, algorithm = 'sha256'): Promise<Buffer> {
    const result = this.createHash(algorithm)
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

class WebCryptoSha2Hash implements Sha2Hash {
  async digest(data: NodeJS.TypedArray, algorithm = 'sha256'): Promise<Buffer> {
    let algo: string
    if (algorithm === 'sha256') {
      algo = 'SHA-256'
    } else if (algorithm === 'sha512') {
      algo = 'SHA-512'
    } else {
      throw new Error(`Unsupported hash algorithm ${algorithm}`)
    }
    const hash = await crypto.subtle.digest(algo, data)
    return Buffer.from(hash)
  }
}

export function createSha2Hash(): Sha2Hash {
  if (isWebCryptoAvailable()) {
    return new WebCryptoSha2Hash()
  } else {
    try {
      // eslint-disable-next-line import/no-nodejs-modules,no-restricted-modules,global-require
      const createHash = require('crypto').createHash
      return new NodeCryptoSha2Hash(createHash)
    } catch (error) {
      throw new Error(NO_CRYPTO_LIB)
    }
  }
}
