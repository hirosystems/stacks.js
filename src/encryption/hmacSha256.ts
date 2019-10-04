import { getCryptoLib } from './cryptoUtils'

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
  subtleCrypto: SubtleCrypto

  constructor(subtleCrypto: SubtleCrypto) {
    this.subtleCrypto = subtleCrypto
  }

  async digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer> {
    const cryptoKey = await this.subtleCrypto.importKey(
      'raw', key, { name: 'HMAC', hash: 'SHA-256' },
      true, ['sign']
    )
    const sig = await this.subtleCrypto.sign('HMAC', cryptoKey, data)
    return Buffer.from(sig)
  }
}

export async function createHmacSha256(): Promise<Hmac> {
  const cryptoLib = await getCryptoLib()
  if (cryptoLib.name === 'subtleCrypto') {
    return new WebCryptoHmacSha256(cryptoLib.lib)
  } else {
    return new NodeCryptoHmacSha256(cryptoLib.lib.createHmac)
  }
}

