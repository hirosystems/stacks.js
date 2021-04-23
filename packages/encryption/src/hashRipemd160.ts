import { Buffer } from '@stacks/common';
import Ripemd160Polyfill from 'ripemd160-min';
import { isNodeCryptoAvailable } from './cryptoUtils';

type NodeCryptoCreateHash = typeof import('crypto').createHash;

export interface Ripemd160Digest {
  digest(data: Buffer): Buffer;
}

export class Ripemd160PolyfillDigest implements Ripemd160Digest {
  digest(data: Buffer): Buffer {
    const instance = new Ripemd160Polyfill();
    instance.update(data);
    const hash = instance.digest();
    if (Array.isArray(hash)) {
      return Buffer.from(hash);
    } else {
      return Buffer.from(hash.buffer);
    }
  }
}

export class NodeCryptoRipemd160Digest implements Ripemd160Digest {
  nodeCryptoCreateHash: NodeCryptoCreateHash;

  constructor(nodeCryptoCreateHash: NodeCryptoCreateHash) {
    this.nodeCryptoCreateHash = nodeCryptoCreateHash;
  }

  digest(data: Buffer): Buffer {
    try {
      return this.nodeCryptoCreateHash('rmd160').update(data).digest();
    } catch (error) {
      try {
        return this.nodeCryptoCreateHash('ripemd160').update(data).digest();
      } catch (_err) {
        console.log(error);
        console.log(
          'Node.js `crypto.createHash` exists but failing to digest for ripemd160, falling back to js implementation'
        );
        const polyfill = new Ripemd160PolyfillDigest();
        return polyfill.digest(data);
      }
    }
  }
}

export function createHashRipemd160() {
  const nodeCryptoCreateHash = isNodeCryptoAvailable(nodeCrypto => {
    if (typeof nodeCrypto.createHash === 'function') {
      return nodeCrypto.createHash;
    }
    return false;
  });
  if (nodeCryptoCreateHash) {
    return new NodeCryptoRipemd160Digest(nodeCryptoCreateHash);
  } else {
    return new Ripemd160PolyfillDigest();
  }
}

export function hashRipemd160(data: Buffer) {
  const hash = createHashRipemd160();
  return hash.digest(data);
}
