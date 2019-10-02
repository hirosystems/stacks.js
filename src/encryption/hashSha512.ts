
// eslint-disable-next-line import/no-nodejs-modules
import { createHash } from 'crypto'
import { Hash } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodeCryptoSha512Hash implements Hash {
  async digest(data: NodeJS.TypedArray): Promise<Buffer> {
    const result = createHash('sha512')
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

export function createHashSha512(): Hash {
  return new NodeCryptoSha512Hash()
}

