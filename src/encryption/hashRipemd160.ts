// eslint-disable-next-line import/no-nodejs-modules
import { createHash } from 'crypto'
import { Hash } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodeCryptoRipemd160Hash implements Hash {
  async digest(data: NodeJS.TypedArray): Promise<Buffer> {
    const result = createHash('rmd160')
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

export function createHashRipemd160(): Hash {
  return new NodeCryptoRipemd160Hash()
}

