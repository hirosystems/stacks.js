// eslint-disable-next-line import/no-nodejs-modules
import { createHmac } from 'crypto'
import { Hmac } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodeCryptoSha256Hmac implements Hmac {
  async digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer> {
    const result = createHmac('sha256', key)
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

// TODO: refactor into Promise<Hmac>
export function createHmacSha256(): Hmac {
  return new NodeCryptoSha256Hmac()
}

