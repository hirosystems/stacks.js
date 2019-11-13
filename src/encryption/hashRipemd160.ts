import Ripemd160Polyfill from 'ripemd160-min'

export class Ripemd160PolyfillDigest {
  async digest(data: Buffer): Promise<Buffer> {
    const instance = new Ripemd160Polyfill()
    instance.update(data)
    const hash = instance.digest()
    if (Array.isArray(hash)) {
      return Promise.resolve(Buffer.from(hash))
    } else {
      return Promise.resolve(Buffer.from(hash.buffer))
    }
  }
}

export function createHashRipemd160() {
  // TODO: Check if Node.js runtime 'crypto' module is available and use the
  //       fast native ripemd160 hash.

  return new Ripemd160PolyfillDigest()
}

