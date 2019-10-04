import { isWebCryptoAvailable, NO_CRYPTO_LIB } from './cryptoUtils'

export interface Hmac {
  digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer>;
}

type NodeCryptoCreateHmac = typeof import('crypto').createHmac

class NodeCryptoHmacSha256 implements Hmac {
  createHmac: NodeCryptoCreateHmac

  constructor(createHmac: NodeCryptoCreateHmac) {
    this.createHmac = createHmac
  }

  async digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer> {
    const result = this.createHmac('sha256', key)
      .update(data)
      .digest()
    return Promise.resolve(result)
  }
}

class WebCryptoHmacSha256 implements Hmac {
  async digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer> {
    const cryptoKey = await crypto.subtle.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' },
      true, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, data)
    return Buffer.from(sig)
  }
}

export function createHmacSha256(): Hmac {
  if (isWebCryptoAvailable()) {
    return new WebCryptoHmacSha256()
  } else {
    try {
      // eslint-disable-next-line import/no-nodejs-modules,no-restricted-modules,global-require
      const createHmac = require('crypto').createHmac
      return new NodeCryptoHmacSha256(createHmac)
    } catch (error) {
      throw new Error(NO_CRYPTO_LIB)
    }
  }
}

