import { ec as EllipticCurve } from 'elliptic'
import { BN } from '../bn'
import { randomBytes } from './cryptoRandom'
import { FailedDecryptionError } from '../errors'
import { getPublicKeyFromPrivate } from '../keys'
import { hashSha256Sync, hashSha512Sync } from './sha2Hash'
import { createHmacSha256 } from './hmacSha256'
import { createCipher } from './aesCipher'

const ecurve = new EllipticCurve('secp256k1')

/**
* @ignore
*/
export type CipherObject = {
  iv: string,
  ephemeralPK: string,
  cipherText: string,
  /** If undefined then (legacy) hex encoding is used for the `cipherText` string. */
  cipherEncoding?: 'b64'
  mac: string,
  wasString: boolean
}

/**
* @ignore
*/
async function aes256CbcEncrypt(iv: Buffer, key: Buffer, plaintext: Buffer): Promise<Buffer> {
  const cipher = await createCipher()
  const result = await cipher.encrypt('aes-256-cbc', key, iv, plaintext)
  return result
}

/**
* @ignore
*/
async function aes256CbcDecrypt(iv: Buffer, key: Buffer, ciphertext: Buffer): Promise<Buffer> {
  const cipher = await createCipher()
  const result = await cipher.decrypt('aes-256-cbc', key, iv, ciphertext)
  return result
}

/**
* @ignore
*/
async function hmacSha256(key: Buffer, content: Buffer) {
  const hmacSha256 = await createHmacSha256()
  return hmacSha256.digest(key, content)
}

/**
* @ignore
*/
function equalConstTime(b1: Buffer, b2: Buffer) {
  if (b1.length !== b2.length) {
    return false
  }
  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]  // jshint ignore:line
  }
  return res === 0
}

/**
* @ignore
*/
function sharedSecretToKeys(sharedSecret: Buffer): { encryptionKey: Buffer; hmacKey: Buffer; } {
  // generate mac and encryption key from shared secret
  const hashedSecret = hashSha512Sync(sharedSecret)
  return {
    encryptionKey: hashedSecret.slice(0, 32),
    hmacKey: hashedSecret.slice(32)
  }
}

/**
* @ignore
*/
export function getHexFromBN(bnInput: BN) {
  const hexOut = bnInput.toString('hex')

  if (hexOut.length === 64) {
    return hexOut
  } else if (hexOut.length < 64) {
    // pad with leading zeros
    // the padStart function would require node 9
    const padding = '0'.repeat(64 - hexOut.length)
    return `${padding}${hexOut}`
  } else {
    throw new Error('Generated a > 32-byte BN for encryption. Failing.')
  }
}

/**
 * @ignore
 */
export function eciesGetJsonByteLength(contentLength: number, wasString: boolean, cipherEncoding?: 'hex' | 'b64'): number {
  // Placeholder structure of the ciphertext payload in order to determine the 
  // stringified JSON length. 
  const payloadShell: CipherObject = {
    iv: '', 
    ephemeralPK: '',
    mac: '',
    cipherText: '',
    wasString,
  }

  // AES has a fixed block size of 16-bytes regardless key size, and CBC block mode 
  // rounds up to the next block size. 
  const cipherTextBufferLength = (Math.floor(contentLength / 16) + 1) * 16
  let encodedCipherTextLength: number
  if (cipherEncoding === 'b64') {
    payloadShell.cipherEncoding = 'b64'
    // Calculate base64 encoded length
    encodedCipherTextLength = (Math.ceil(cipherTextBufferLength / 3) * 4)
  } else {
    // Hex encoded length
    encodedCipherTextLength = (cipherTextBufferLength * 2)
  }
  // Get the JSON payload wrapper stringified length.
  const jsonShellLength = JSON.stringify(payloadShell).length
  // Hex encoded 16 byte buffer.
  const ivLength = 32
  // Hex encoded, compressed EC pubkey of 33 bytes
  const ephemeralPKLength = 66
  // Hex encoded 32 byte hmac-sha256
  const macLength = 64

  // Add the length of the JSON structure and expected length of the values.
  return jsonShellLength + encodedCipherTextLength + ivLength + ephemeralPKLength + macLength
}

/**
 * Encrypt content to elliptic curve publicKey using ECIES
 * @param {String} publicKey - secp256k1 public key hex string
 * @param {String | Buffer} content - content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * 
 * @private
 * @ignore
 */
export async function encryptECIES(publicKey: string, content: Buffer, wasString: boolean): 
  Promise<CipherObject> {
  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic()
  const ephemeralSK = ecurve.genKeyPair()
  const ephemeralPK = ephemeralSK.getPublic()
  const sharedSecret = ephemeralSK.derive(ecPK) as BN

  const sharedSecretHex = getHexFromBN(sharedSecret)

  const sharedKeys = sharedSecretToKeys(
    Buffer.from(sharedSecretHex, 'hex')
  )

  const initializationVector = randomBytes(16)

  const cipherText = await aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, content
  )

  const macData = Buffer.concat([initializationVector,
                                 Buffer.from(ephemeralPK.encode('array', true)),
                                 cipherText])
  const mac = await hmacSha256(sharedKeys.hmacKey, macData)

  const USE_LEGACY_CIPHER_ENCODING = true
  const cipherTextString = USE_LEGACY_CIPHER_ENCODING 
    ? cipherText.toString('hex') 
    : cipherText.toString('base64')
  
  const result: CipherObject = {
    iv: initializationVector.toString('hex'),
    ephemeralPK: ephemeralPK.encode('hex', true),
    cipherText: cipherTextString,
    mac: mac.toString('hex'),
    wasString
  }
  if (!USE_LEGACY_CIPHER_ENCODING) {
    result.cipherEncoding = 'b64'
  }
  return result
}

/**
 * Decrypt content encrypted using ECIES
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} cipherObject - object to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * @return {Buffer} plaintext
 * @throws {FailedDecryptionError} if unable to decrypt
 * @private
 * @ignore
 */
export async function decryptECIES(privateKey: string, cipherObject: CipherObject): 
  Promise<Buffer | string> {
  const ecSK = ecurve.keyFromPrivate(privateKey, 'hex')
  let ephemeralPK = null
  try {
    ephemeralPK = ecurve.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic()
  } catch (error) {
    throw new FailedDecryptionError('Unable to get public key from cipher object. '
      + 'You might be trying to decrypt an unencrypted object.')
  }

  const sharedSecret = ecSK.derive(ephemeralPK)
  const sharedSecretBuffer = Buffer.from(getHexFromBN(sharedSecret), 'hex')

  const sharedKeys = sharedSecretToKeys(sharedSecretBuffer)

  const ivBuffer = Buffer.from(cipherObject.iv, 'hex')
  const cipherTextBuffer = Buffer.from(cipherObject.cipherText, 'hex')

  const macData = Buffer.concat([ivBuffer,
                                 Buffer.from(ephemeralPK.encode('array', true)),
                                 cipherTextBuffer])
  const actualMac = await hmacSha256(sharedKeys.hmacKey, macData)
  const expectedMac = Buffer.from(cipherObject.mac, 'hex')
  if (!equalConstTime(expectedMac, actualMac)) {
    throw new FailedDecryptionError('Decryption failed: failure in MAC check')
  }
  const plainText = await aes256CbcDecrypt(
    ivBuffer, sharedKeys.encryptionKey, cipherTextBuffer
  )

  if (cipherObject.wasString) {
    return plainText.toString()
  } else {
    return plainText
  }
}

/**
 * Sign content using ECDSA
 *
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 * @private
 * @ignore
 */
export function signECDSA(privateKey: string, content: string | Buffer): { 
  publicKey: string, signature: string 
} {
  const contentBuffer = content instanceof Buffer ? content : Buffer.from(content)
  const ecPrivate = ecurve.keyFromPrivate(privateKey, 'hex')
  const publicKey = getPublicKeyFromPrivate(privateKey)
  const contentHash = hashSha256Sync(contentBuffer)
  const signature = ecPrivate.sign(contentHash)
  const signatureString = signature.toDER('hex')

  return {
    signature: signatureString,
    publicKey
  }
}

/**
* @ignore
*/
function getBuffer(content: string | ArrayBuffer | Buffer) {
  if (content instanceof Buffer) return content
  else if (content instanceof ArrayBuffer) return Buffer.from(content)
  else return Buffer.from(content)
}

/**
 * Verify content using ECDSA
 * @param {String | Buffer} content - Content to verify was signed
 * @param {String} publicKey - secp256k1 private key hex string
 * @param {String} signature - Hex encoded DER signature
 * @return {Boolean} returns true when signature matches publickey + content, false if not
 * @private
 * @ignore
 */
export function verifyECDSA(
  content: string | ArrayBuffer | Buffer,
  publicKey: string,
  signature: string): boolean {
  const contentBuffer = getBuffer(content)
  const ecPublic = ecurve.keyFromPublic(publicKey, 'hex')
  const contentHash = hashSha256Sync(contentBuffer)

  return ecPublic.verify(contentHash, <any>signature)
}
