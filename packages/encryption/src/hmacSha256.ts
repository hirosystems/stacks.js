import { Buffer } from '@stacks/common';
import { getCryptoLib } from './cryptoUtils';

export interface Hmac {
  digest(key: Buffer, data: Buffer): Promise<Buffer>;
}

type NodeCryptoCreateHmac = typeof import('crypto').createHmac;

export class NodeCryptoHmacSha256 implements Hmac {
  createHmac: NodeCryptoCreateHmac;

  constructor(createHmac: NodeCryptoCreateHmac) {
    this.createHmac = createHmac;
  }

  async digest(key: Buffer, data: Buffer): Promise<Buffer> {
    const result = this.createHmac('sha256', key).update(data).digest();
    return Promise.resolve(result);
  }
}

export class WebCryptoHmacSha256 implements Hmac {
  subtleCrypto: SubtleCrypto;

  constructor(subtleCrypto: SubtleCrypto) {
    this.subtleCrypto = subtleCrypto;
  }

  async digest(key: Buffer, data: Buffer): Promise<Buffer> {
    const cryptoKey = await this.subtleCrypto.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign']
    );
    const sig = await this.subtleCrypto.sign(
      // The `hash` is only specified for non-compliant browsers like Edge.
      { name: 'HMAC', hash: 'SHA-256' },
      cryptoKey,
      data
    );
    return Buffer.from(sig);
  }
}

export async function createHmacSha256(): Promise<Hmac> {
  const cryptoLib = await getCryptoLib();
  if (cryptoLib.name === 'subtleCrypto') {
    return new WebCryptoHmacSha256(cryptoLib.lib);
  } else {
    return new NodeCryptoHmacSha256(cryptoLib.lib.createHmac);
  }
}
