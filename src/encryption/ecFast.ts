import assert from 'assert'
import { getWebCrypto } from './webCrypto'
import { 
  generatePrivateKey, getPublicKeyFromPrivate, 
  signMessage, verifyMessage, 
  computeSharedSecret, 
  decompressPublicKey, compressPublicKey 
} from './secp256k1-wasm'

const DEBUG_CHECK = true

export type CipherObject = {
  iv: string,
  ephemeralPK: string,
  cipherText: string,
  mac: string,
  wasString: boolean
}


async function aes256CbcEncrypt(
  iv: Buffer | Uint8Array, 
  key: Buffer | Uint8Array, 
  plaintext: Buffer | Uint8Array
): Promise<Buffer> {
  const webCrypto = await getWebCrypto()

  const cryptoKey = await webCrypto.subtle.importKey(
    'raw', key,
    { name: 'AES-CBC', length: 256 },
    false, ['encrypt']
  )
  const cipher = await webCrypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey, plaintext
  )

  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const _cipher = nodeCrypto.createCipheriv('aes-256-cbc', key, iv)
    const _res = Buffer.concat([_cipher.update(plaintext), _cipher.final()])
    const _resHex = _res.toString('hex')
    const resHex = Buffer.from(cipher).toString('hex')
    assert.equal(resHex, _resHex)
  }

  return Buffer.from(cipher)
}

async function aes256CbcDecrypt(
  iv: Buffer | Uint8Array, 
  key: Buffer | Uint8Array, 
  ciphertext: Buffer | Uint8Array
): Promise<Buffer> {
  const webCrypto = await getWebCrypto()

  const cryptoKey = await webCrypto.subtle.importKey(
    'raw', key,
    { name: 'AES-CBC', length: 256 },
    false, ['decrypt']
  )
  const plaintext = await webCrypto.subtle.decrypt(
    { name: 'AES-CBC', iv },
    cryptoKey, ciphertext
  )

  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const _cipher = nodeCrypto.createDecipheriv('aes-256-cbc', key, iv)
    const _res = Buffer.concat([_cipher.update(ciphertext), _cipher.final()]).toString('hex')
    const res = Buffer.from(plaintext).toString('hex')
    assert.equal(res, _res)
  }

  return Buffer.from(plaintext)
}

async function hmacSha256(
  keyData: Buffer | Uint8Array, 
  content: Buffer | Uint8Array
): Promise<Buffer> {
  const webCrypto = await getWebCrypto()
  const key = await webCrypto.subtle.importKey(
    'raw', keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  
  const sig = await webCrypto.subtle.sign('HMAC', key, content)
  
  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const expected = nodeCrypto.createHmac('sha256', keyData).update(content).digest().toString('hex')
    const actual = Buffer.from(sig).toString('hex')
    assert.equal(actual, expected)
  }

  return Buffer.from(sig)
}

function equalConstTime(b1: Buffer | Uint8Array, b2: Buffer | Uint8Array) {
  if (b1.length !== b2.length) {
    return false
  }
  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]  // jshint ignore:line
  }
  return res === 0
}

async function sharedSecretToKeys(sharedSecret: Buffer | Uint8Array) {
  const webCrypto = await getWebCrypto()
  // generate mac and encryption key from shared secret
  const hashedSecretArr = await webCrypto.subtle.digest('SHA-512', sharedSecret)
  const hashedSecret = new Uint8Array(hashedSecretArr)

  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const expected = nodeCrypto.createHash('sha512').update(sharedSecret).digest().toString('hex')
    const actual = Buffer.from(hashedSecret).toString('hex')
    assert.equal(actual, expected)
  }

  return {
    encryptionKey: hashedSecret.slice(0, 32),
    hmacKey: hashedSecret.slice(32)
  }
}

export function getHexFromBN(bnInput: import('bn.js')) {
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
 *  @private
 */
export async function encryptECIES(
  publicKey: string, 
  content: string | Buffer | Uint8Array
): Promise<CipherObject> {
  const isString = (typeof (content) === 'string')

  // always copy to buffer
  const plainText = typeof content === 'string' ? Buffer.from(content) : Buffer.from(content)
  
  const webCrypto = await getWebCrypto()

  const ephemeralSK = await generatePrivateKey()
  const ephemeralPK = await getPublicKeyFromPrivate(ephemeralSK)
  const decompressedPK = await decompressPublicKey(publicKey)
  const sharedSecret = await computeSharedSecret(ephemeralSK, decompressedPK)
  const sharedKeys = await sharedSecretToKeys(
    Buffer.from(sharedSecret, 'hex')
  )

  if (DEBUG_CHECK) {
    const { ec } = await import('elliptic')
    const ecurveSlow = new ec('secp256k1')
    // const _ephemeralSK = ecurveSlow.genKeyPair()
    const _ephemeralSK = ecurveSlow.keyFromPrivate(Buffer.from(ephemeralSK))
    const _ephemeralPK = _ephemeralSK.getPublic()
    const _ephemeralPKCompressed = Buffer.from(_ephemeralPK.encodeCompressed()).toString('hex')
    const _ecPK = ecurveSlow.keyFromPublic(publicKey, 'hex').getPublic()
    const _ecPK_hex = ecurveSlow.keyFromPublic(publicKey, 'hex').getPublic('hex')
    const _sharedSecret = _ephemeralSK.derive(_ecPK)
    const _sharedSecretHex = getHexFromBN(_sharedSecret)


    assert.equal(ephemeralPK, _ephemeralPKCompressed)
    assert.equal(decompressedPK, _ecPK_hex)
    assert.equal(sharedSecret, _sharedSecretHex)
  }

  const initializationVector = Buffer.alloc(16)
  webCrypto.getRandomValues(initializationVector)

  const cipherText = await aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, plainText
  )

  const macData = Buffer.concat([initializationVector,
                                 Buffer.from(ephemeralPK, 'hex'),
                                 cipherText])
  const macBytes = await hmacSha256(sharedKeys.hmacKey, macData)
  const mac = macBytes.toString('hex')

  return {
    iv: initializationVector.toString('hex'),
    ephemeralPK,
    cipherText: cipherText.toString('hex'),
    mac,
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
 */
export async function decryptECIES(
  privateKey: string, cipherObject: CipherObject
): Promise<string | Buffer | Uint8Array> {
  const ephemeralPK = await decompressPublicKey(cipherObject.ephemeralPK)
  const ephemeralPKCompressed = await compressPublicKey(ephemeralPK)
  const sharedSecret = await computeSharedSecret(privateKey, ephemeralPK)
  const sharedSecretBuffer = await Buffer.from(sharedSecret, 'hex')

  if (DEBUG_CHECK) {
    const { ec } = await import('elliptic')
    const ecurveSlow = new ec('secp256k1')
    const _ecSK = ecurveSlow.keyFromPrivate(privateKey, 'hex')
    const _ephemeralPK = ecurveSlow.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic()
    const _ephemeralPKCompressed = Buffer.from(_ephemeralPK.encodeCompressed()).toString('hex')
    const _sharedSecret = _ecSK.derive(_ephemeralPK)
    const _sharedSecretBuffer = Buffer.from(getHexFromBN(_sharedSecret), 'hex')
    const _sharedSecretHex = _sharedSecretBuffer.toString('hex')

    assert.equal(ephemeralPKCompressed, _ephemeralPKCompressed)
    assert.equal(sharedSecret, _sharedSecretHex)
  }

  const sharedKeys = await sharedSecretToKeys(sharedSecretBuffer)

  const ivBuffer = Buffer.from(cipherObject.iv, 'hex')
  const cipherTextBuffer = Buffer.from(cipherObject.cipherText, 'hex')

  const macData = Buffer.concat([ivBuffer,
                                 Buffer.from(ephemeralPKCompressed, 'hex'),
                                 cipherTextBuffer])
  const actualMac = await hmacSha256(sharedKeys.hmacKey, macData)
  const expectedMac = Buffer.from(cipherObject.mac, 'hex')
  if (!equalConstTime(expectedMac, actualMac)) {
    throw new Error('Decryption failed: failure in MAC check')
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
 * @private
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 * @private
 */
export async function signECDSA(
  privateKey: string, 
  content: string | Buffer | Uint8Array
): Promise<{publicKey: string, signature: string}> {
  const webCrypto = await getWebCrypto()
  const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content
  const msgHash = await webCrypto.subtle.digest('SHA-256', contentBuffer)
  const msgBytes = new Uint8Array(msgHash)
  const publicKey = await getPublicKeyFromPrivate(privateKey)
  const signature = await signMessage(privateKey, msgBytes)

  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const { ec } = await import('elliptic')
    const ecurveSlow = new ec('secp256k1')
    const fn = await import('../keys')
    const _publicKey = fn.getPublicKeyFromPrivate(privateKey)
    const _msgHash = nodeCrypto.createHash('sha256').update(contentBuffer).digest()
    const _signature: string = ecurveSlow.keyFromPrivate(privateKey, 'hex').sign(_msgHash).toDER('hex')
    const _hashHex = Buffer.from(_msgHash).toString('hex')
    const hashHex = Buffer.from(msgHash).toString('hex')
    assert.equal(publicKey, _publicKey)
    assert.equal(hashHex, _hashHex)
    assert.equal(signature, _signature)
  }

  return {
    signature,
    publicKey
  }
}

/**
 * Verify content using ECDSA
 * @param {String | Buffer} content - Content to verify was signed
 * @param {String} publicKey - secp256k1 private key hex string
 * @param {String} signature - Hex encoded DER signature
 * @return {Boolean} returns true when signature matches publickey + content, false if not
 * @private
 */
export async function verifyECDSA(
  content: string | Buffer | Uint8Array,
  publicKey: string,
  signature: string
): Promise<boolean> {
  const webCrypto = await getWebCrypto()
  const contentBuffer = typeof content === 'string' ? Buffer.from(content) : content

  const contentHash = await webCrypto.subtle.digest('SHA-256', contentBuffer)
  const contentBytes = new Uint8Array(contentHash)
  const verified = await verifyMessage(signature, publicKey, contentBytes)

  if (DEBUG_CHECK) {
    const nodeCrypto = await import('crypto')
    const { ec } = await import('elliptic')
    const ecurveSlow = new ec('secp256k1')
    const _contentHash = nodeCrypto.createHash('sha256').update(contentBuffer).digest()
    const _verified = ecurveSlow.keyFromPublic(publicKey, 'hex').verify(_contentHash, <any>signature)
    const _hashHex = Buffer.from(_contentHash).toString('hex')
    const hashHex = Buffer.from(contentBytes).toString('hex')
    assert.equal(hashHex, _hashHex)
    assert.equal(verified, _verified)
  }

  return verified
}
