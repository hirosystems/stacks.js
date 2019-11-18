import Ripemd160Polyfill from 'ripemd160-min'
import { isNodeCryptoAvailable } from './cryptoUtils'

type NodeHash = import('crypto').Hash

export interface Ripemd160Digest {
  digest(data: Buffer): Buffer
}

export class Ripemd160PolyfillDigest implements Ripemd160Digest {
  digest(data: Buffer): Buffer {
    const instance = new Ripemd160Polyfill()
    instance.update(data)
    const hash = instance.digest()
    if (Array.isArray(hash)) {
      return Buffer.from(hash)
    } else {
      return Buffer.from(hash.buffer)
    }
  }
}

export class NodeCryptoRipemd160Digest implements Ripemd160Digest {
  nodeRmd160Hasher: () => NodeHash

  constructor(nodeRmd160Hash: () => NodeHash) {
    this.nodeRmd160Hasher = nodeRmd160Hash
  }

  digest(data: Buffer): Buffer {
    const hasher = this.nodeRmd160Hasher()
    const result = hasher.update(data).digest()
    return result
  }
}

export function createHashRipemd160() {
  const hasher = isNodeCryptoAvailable(nodeCrypto => {
    if (!nodeCrypto.createHash) {
      return false
    }
    try {
      const hasher = () => nodeCrypto.createHash('rmd160')
      if (hasher()) {
        return hasher
      }
    } catch (error) {
      const hasher = () => nodeCrypto.createHash('ripemd160')
      if (hasher()) {
        return hasher
      }
    }
    return false
  })
  if (hasher) {
    return new NodeCryptoRipemd160Digest(hasher)
  } else {
    return new Ripemd160PolyfillDigest()
  }
}

export function hashRipemd160(data: Buffer) {
  const hash = createHashRipemd160()
  return hash.digest(data)
}
