
import { ec as EllipticCurve } from 'elliptic'
// @ts-ignore
import * as BN from 'bn.js'
import * as crypto from 'crypto'
import { getPublicKeyFromPrivate } from '../keys'

const ecurve = new EllipticCurve('secp256k1')

/**
* @ignore
*/
export type CipherObject = {
  iv: string,
  ephemeralPK: string,
  cipherText: string,
  mac: string,
  wasString: boolean
}

/**
* @ignore
*/
function aes256CbcEncrypt(iv: Buffer, key: Buffer, plaintext: Buffer) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(plaintext), cipher.final()])
}

/**
* @ignore
*/
function aes256CbcDecrypt(iv: Buffer, key: Buffer, ciphertext: Buffer) {
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(ciphertext), cipher.final()])
}

/**
* @ignore
*/
function hmacSha256(key: Buffer, content: Buffer) {
  return crypto.createHmac('sha256', key).update(content).digest()
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
function sharedSecretToKeys(sharedSecret: Buffer) {
  // generate mac and encryption key from shared secret
  const hashedSecret = crypto.createHash('sha512').update(sharedSecret).digest()
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
export function encryptECIES(publicKey: string, content: string | Buffer): CipherObject {
  const isString = (typeof (content) === 'string')
  // always copy to buffer
  const plainText = content instanceof Buffer ? Buffer.from(content) : Buffer.from(content)

  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic()
  const ephemeralSK = ecurve.genKeyPair()
  const ephemeralPK = ephemeralSK.getPublic()
  const sharedSecret = ephemeralSK.derive(ecPK) as BN

  const sharedSecretHex = getHexFromBN(sharedSecret)

  const sharedKeys = sharedSecretToKeys(
    Buffer.from(sharedSecretHex, 'hex')
  )

  const initializationVector = crypto.randomBytes(16)

  const cipherText = aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, plainText
  )

  const macData = Buffer.concat([initializationVector,
                                 Buffer.from(ephemeralPK.encode('array', true) as Buffer),
                                 cipherText])
  const mac = hmacSha256(sharedKeys.hmacKey, macData)

  return {
    iv: initializationVector.toString('hex'),
    ephemeralPK: ephemeralPK.encode('hex', true) as string,
    cipherText: cipherText.toString('hex'),
    mac: mac.toString('hex'),
    wasString: isString
  }
}

/**
 * Decrypt content encrypted using ECIES
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} cipherObject - object to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * @return {Buffer} plaintext
 * @throws {Error} if unable to decrypt
 * @private
 * @ignore
 */
export function decryptECIES(privateKey: string, cipherObject: CipherObject): Buffer | string {
  const ecSK = ecurve.keyFromPrivate(privateKey, 'hex')
  const ephemeralPK = ecurve.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic()
  const sharedSecret = ecSK.derive(ephemeralPK)
  const sharedSecretBuffer = Buffer.from(getHexFromBN(sharedSecret), 'hex')

  const sharedKeys = sharedSecretToKeys(sharedSecretBuffer)

  const ivBuffer = Buffer.from(cipherObject.iv, 'hex')
  const cipherTextBuffer = Buffer.from(cipherObject.cipherText, 'hex')

  const macData = Buffer.concat([ivBuffer,
                                 Buffer.from(ephemeralPK.encode('array', true) as Buffer),
                                 cipherTextBuffer])
  const actualMac = hmacSha256(sharedKeys.hmacKey, macData)
  const expectedMac = Buffer.from(cipherObject.mac, 'hex')
  if (!equalConstTime(expectedMac, actualMac)) {
    throw new Error('Decryption failed: failure in MAC check')
  }
  const plainText = aes256CbcDecrypt(
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
  const contentHash = crypto.createHash('sha256').update(contentBuffer).digest()
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
export function verifyECDSA(content: string | ArrayBuffer | Buffer,
                            publicKey: string,
                            signature: string) {
  const contentBuffer = getBuffer(content)
  const ecPublic = ecurve.keyFromPublic(publicKey, 'hex')
  const contentHash = crypto.createHash('sha256').update(contentBuffer).digest()

  return ecPublic.verify(contentHash, <any>signature)
}
