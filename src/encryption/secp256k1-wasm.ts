// Import only exactly what we need for packing / tree-shaking purposes.
import { instantiateSecp256k1, Secp256k1 } from 'bitcoin-ts/build/main/lib/crypto/secp256k1'
import { getWebCrypto } from './webCrypto'

let cachedSecp256k1: Promise<Secp256k1> = null
async function getSecp256k1(): Promise<Secp256k1> {
  if (cachedSecp256k1 === null) {
    cachedSecp256k1 = createSecp256k1()
  }
  return cachedSecp256k1
}

async function createSecp256k1(): Promise<Secp256k1> {
  const webCrypto = await getWebCrypto()
  const seed = new Uint8Array(32)
  webCrypto.getRandomValues(seed)
  const instance = await instantiateSecp256k1(seed)
  return instance
}

/**
 * @param privateKey hex string or buffer
 * @returns hex string
 */
export async function getPublicKeyFromPrivate(
  privateKey: string | Buffer | Uint8Array,
  compressed = true
): Promise<string> {
  const secp256k1 = await getSecp256k1()
  const keyBytes = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
  const publicKeyBytes = compressed 
    ? await secp256k1.derivePublicKeyCompressed(keyBytes)
    : await secp256k1.derivePublicKeyUncompressed(keyBytes)
  const publicKeyHex = Buffer.from(publicKeyBytes).toString('hex')
  return publicKeyHex
}

export async function compressPublicKey(
  publicKey: string | Buffer | Uint8Array
): Promise<string> {
  const secp256k1 = await getSecp256k1()
  const keyBytes = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
  const compressed = secp256k1.compressPublicKey(keyBytes)
  const hex = Buffer.from(compressed).toString('hex')
  return hex
}

export async function decompressPublicKey(
  publicKey: string | Buffer | Uint8Array
): Promise<string> {
  const secp256k1 = await getSecp256k1()
  const keyBytes = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
  const decompressed = secp256k1.uncompressPublicKey(keyBytes)
  const hex = Buffer.from(decompressed).toString('hex')
  return hex
}

export async function signMessage(
  privateKey: string | Buffer | Uint8Array, 
  message: Buffer | Uint8Array
): Promise<string> {
  const secp256k1 = await getSecp256k1()
  const keyBytes = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
  const sigBytes = await secp256k1.signMessageHashDER(keyBytes, message)
  const sigHex = Buffer.from(sigBytes).toString('hex')
  return sigHex
}

export async function verifyMessage(
  signature: string | Buffer | Uint8Array, 
  publicKey: string | Buffer | Uint8Array, 
  messageHash: Buffer | Uint8Array
): Promise<boolean> {
  const secp256k1 = await getSecp256k1()
  const sigBytes = typeof signature === 'string' ? Buffer.from(signature, 'hex') : signature
  const keyBytes = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
  const result1 = secp256k1.verifySignatureDER(sigBytes, keyBytes, messageHash)
  // const result2 = secp256k1.verifySignatureDERLowS(sigBytes, keyBytes, messageHash)
  return result1
}

export async function generatePrivateKey(): Promise<Buffer | Uint8Array> {
  const secp256k1 = await getSecp256k1()
  const webCrypto = await getWebCrypto()
  const privateKey = new Uint8Array(32)
  /**
   * Note: This is typical usage of libsecp256k1. Nearly every 256 number is a valid secp256k1 
   * private key, so just wrap `validate` around a cryptographic-random generator. See any other 
   * example usage of generating keys with libsecp256k1. 
   * @see https://github.com/bitauth/bitcoin-ts/blob/cd8f44d639348d5f3917f7cf78b6e35f8c1b28ce/src/lib/crypto/secp256k1.ts#L327
   * @see https://github.com/MeadowSuite/Secp256k1.Net/blob/1fc63e5342e7ecbe185789cdc61811576398a6cc/Secp256k1.Net.Test/Tests.cs#L18
   * @see https://github.com/Bablakeluke/secp256k1-php/blob/d54a59463d38383667dac3703b264e5e88ce3d60/tests/TestCase.php#L32
   */
  do {
    webCrypto.getRandomValues(privateKey)
  } while (!secp256k1.validatePrivateKey(privateKey))
  return Buffer.from(privateKey)
}

export async function computeSharedSecret(
  privateKey: string | Buffer | Uint8Array,
  publicKey: string | Buffer | Uint8Array
): Promise<string> {
  const secp256k1 = await getSecp256k1()
  const privateKeyBytes = typeof privateKey === 'string' ? Buffer.from(privateKey, 'hex') : privateKey
  const publicKeyBytes = typeof publicKey === 'string' ? Buffer.from(publicKey, 'hex') : publicKey
  const secret = await secp256k1.computeEcdhSecret(publicKeyBytes, privateKeyBytes)
  const secretHex = Buffer.from(secret).toString('hex')
  return secretHex
}
