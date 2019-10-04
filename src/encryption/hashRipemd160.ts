import RIPEMD160 from 'ripemd160-min'

class Ripemd160Digest {
  async digest(data: NodeJS.TypedArray): Promise<Buffer> {
    const instance = new RIPEMD160()
    if (Buffer.isBuffer(data)) {
      instance.update(data)
    } else {
      instance.update(Buffer.from(data.buffer))
    }
    const hash = instance.digest()
    if (Array.isArray(hash)) {
      return Promise.resolve(Buffer.from(hash))
    } else {
      return Promise.resolve(Buffer.from(hash.buffer))
    }
  }
}

export function createHashRipemd160() {
  return new Ripemd160Digest()
}

