
// eslint-disable-next-line import/no-nodejs-modules
import { createHash } from 'crypto'
import { Hash } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodeCryptoSha256Hash implements Hash {
  async digest(data: NodeJS.TypedArray): Promise<Buffer> {
    const result = createHash('sha256')
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

export function createHashSha256(): Hash {
  return new NodeCryptoSha256Hash()
}

