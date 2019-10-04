import RIPEMD160 from 'ripemd160-min'

class Ripemd160Digest {
  async digest(data: NodeJS.TypedArray): Promise<Buffer> {
    const instance = new RIPEMD160()
    const hash = instance.update(Array.from(data)).digest()
    const buffer = Buffer.from(hash)
    return Promise.resolve(buffer)
  }
}

export function createHashRipemd160() {
  return new Ripemd160Digest()
}

