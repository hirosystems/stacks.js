export interface Hmac {
  digest(key: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer>;
}

export interface Cipher {
  encrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer>;
  decrypt(key: NodeJS.TypedArray, iv: NodeJS.TypedArray, data: NodeJS.TypedArray): Promise<Buffer>;
}

export type Pbkdf2Digests = 'sha512' | 'sha256'

export interface Pbkdf2 {
  derive(
    password: string, 
    salt: NodeJS.TypedArray,
    iterations: number, 
    keyLength: number, 
    digest: Pbkdf2Digests): Promise<Buffer>;
}

export function isWebCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}

export const NO_CRYPTO_LIB = 'Crypto lib not found. Either the WebCrypto "crypto.subtle" or Node.js "crypto" module must be available.'
