import { getCryptoLib } from './cryptoUtils'

type NodeCryptoCreateCipher = typeof import('crypto').createCipheriv;
type NodeCryptoCreateDecipher = typeof import('crypto').createDecipheriv;

export type CipherAlgorithm = 'aes-256-cbc' | 'aes-128-cbc';

export interface Cipher {
  encrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): Promise<Buffer>;

  decrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): Promise<Buffer>;
}

class NodeCryptoCipher implements Cipher {
  createCipher: NodeCryptoCreateCipher

  createDecipher: NodeCryptoCreateDecipher

  constructor(createCipher: NodeCryptoCreateCipher, createDecipher: NodeCryptoCreateDecipher) {
    this.createCipher = createCipher
    this.createDecipher = createDecipher
  }

  async encrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): 
    Promise<Buffer> {
    if (algorithm !== 'aes-128-cbc' && algorithm !== 'aes-256-cbc') {
      throw new Error(`Unsupported cipher algorithm "${algorithm}"`)
    }
    const cipher = this.createCipher(algorithm, key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }

  async decrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): 
    Promise<Buffer> {
    if (algorithm !== 'aes-128-cbc' && algorithm !== 'aes-256-cbc') {
      throw new Error(`Unsupported cipher algorithm "${algorithm}"`)
    }
    const cipher = this.createDecipher(algorithm, key, iv)
    const result = Buffer.concat([cipher.update(data), cipher.final()])
    return Promise.resolve(result)
  }
}

class WebCryptoCipher implements Cipher {
  subtleCrypto: SubtleCrypto

  constructor(subtleCrypto: SubtleCrypto) {
    this.subtleCrypto = subtleCrypto
  }

  async encrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): 
    Promise<Buffer> {
    let algo: string
    let length: number
    if (algorithm === 'aes-128-cbc') {
      algo = 'AES-CBC'
      length = 128
    } else if (algorithm === 'aes-256-cbc') {
      algo = 'AES-CBC'
      length = 256
    } else {
      throw new Error(`Unsupported cipher algorithm "${algorithm}"`)
    }
    const cryptoKey = await this.subtleCrypto.importKey(
      'raw', key,
      { name: algo, length },
      false, ['encrypt']
    )
    const result = await this.subtleCrypto.encrypt({ name: algo, iv }, cryptoKey, data)
    return Buffer.from(result)
  }

  async decrypt(
    algorithm: CipherAlgorithm, 
    key: NodeJS.TypedArray, 
    iv: NodeJS.TypedArray, 
    data: NodeJS.TypedArray): 
    Promise<Buffer> {
    let algo: string
    let length: number
    if (algorithm === 'aes-128-cbc') {
      algo = 'AES-CBC'
      length = 128
    } else if (algorithm === 'aes-256-cbc') {
      algo = 'AES-CBC'
      length = 256
    } else {
      throw new Error(`Unsupported cipher algorithm "${algorithm}"`)
    }
    const cryptoKey = await this.subtleCrypto.importKey(
      'raw', key,
      { name: algo, length },
      false, ['decrypt']
    )
    const result = await this.subtleCrypto.decrypt({ name: algo, iv }, cryptoKey, data)
    return Buffer.from(result)
  }
}

export async function createCipher(): Promise<Cipher> {
  const cryptoLib = await getCryptoLib()
  if (cryptoLib.name === 'subtleCrypto') {
    return new WebCryptoCipher(cryptoLib.lib)
  } else {
    return new NodeCryptoCipher(cryptoLib.lib.createCipheriv, cryptoLib.lib.createDecipheriv)
  }
}
