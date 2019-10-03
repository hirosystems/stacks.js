// eslint-disable-next-line import/no-nodejs-modules
import { createCipheriv, createDecipheriv } from 'crypto'
import { Cipher } from './cryptoInterfaces'

// TODO: Create a WebCrypto implementation for browser usage

class NodeCryptoAes256CbcCipher implements Cipher {
  async encrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): 
    Promise<Buffer> {
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }

  async decrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): 
    Promise<Buffer> {
    const cipher = createDecipheriv('aes-256-cbc', key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }
}

class NodeCryptoAes128CbcCipher implements Cipher {
  async encrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): 
    Promise<Buffer> {
    const cipher = createCipheriv('aes-128-cbc', key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }

  async decrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): 
    Promise<Buffer> {
    const cipher = createDecipheriv('aes-128-cbc', key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }
}

export function createCipherAes256Cbc(): Cipher {
  return new NodeCryptoAes256CbcCipher()
}

export function createCipherAes128Cbc(): Cipher {
  return new NodeCryptoAes128CbcCipher()
}
