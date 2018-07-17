/* @flow */
import { ec as EllipticCurve } from 'elliptic'
import crypto from 'crypto'
import bip39 from 'bip39'
import triplesec from 'triplesec'
import { getPublicKeyFromPrivate } from './keys'

const ecurve = new EllipticCurve('secp256k1')

export type CipherObject = { iv: string,
                             ephemeralPK: string,
                             cipherText: string,
                             mac: string,
                             wasString: boolean }

function aes256CbcEncrypt(iv : Buffer, key : Buffer, plaintext : Buffer) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(plaintext), cipher.final()])
}

function aes256CbcDecrypt(iv : Buffer, key : Buffer, ciphertext : Buffer) {
  const cipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([cipher.update(ciphertext), cipher.final()])
}

function hmacSha256(key : Buffer, content : Buffer) {
  return crypto.createHmac('sha256', key).update(content).digest()
}

function equalConstTime(b1 : Buffer, b2 : Buffer) {
  if (b1.length !== b2.length) {
    return false
  }
  let res = 0
  for (let i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i]  // jshint ignore:line
  }
  return res === 0
}

function sharedSecretToKeys(sharedSecret : Buffer) {
  // generate mac and encryption key from shared secret
  const hashedSecret = crypto.createHash('sha512').update(sharedSecret).digest()
  return { encryptionKey: hashedSecret.slice(0, 32),
           hmacKey: hashedSecret.slice(32) }
}

export function getHexFromBN(bnInput: Object) {
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
 * @private
 * @param {String} publicKey - secp256k1 public key hex string
 * @param {String | Buffer} content - content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 */
export function encryptECIES(publicKey: string, content: string | Buffer) : CipherObject {
  const isString = (typeof(content) === 'string')
  const plainText = Buffer.from(content) // always copy to buffer

  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic()
  const ephemeralSK = ecurve.genKeyPair()
  const ephemeralPK = ephemeralSK.getPublic()
  const sharedSecret = ephemeralSK.derive(ecPK)

  const sharedSecretHex = getHexFromBN(sharedSecret)

  const sharedKeys = sharedSecretToKeys(
    new Buffer(sharedSecretHex, 'hex'))

  const initializationVector = crypto.randomBytes(16)

  const cipherText = aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, plainText)

  const macData = Buffer.concat([initializationVector,
                                 new Buffer(ephemeralPK.encodeCompressed()),
                                 cipherText])
  const mac = hmacSha256(sharedKeys.hmacKey, macData)

  return { iv: initializationVector.toString('hex'),
           ephemeralPK: ephemeralPK.encodeCompressed('hex'),
           cipherText: cipherText.toString('hex'),
           mac: mac.toString('hex'),
           wasString: isString }
}

/**
 * Decrypt content encrypted using ECIES
 * @private
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} cipherObject - object to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 *  wasString (boolean indicating with or not to return a buffer or string on decrypt)
 * @return {Buffer} plaintext
 * @throws {Error} if unable to decrypt
 */
export function decryptECIES(privateKey: string, cipherObject: CipherObject): Buffer | string {
  const ecSK = ecurve.keyFromPrivate(privateKey, 'hex')
  const ephemeralPK = ecurve.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic()
  const sharedSecret = ecSK.derive(ephemeralPK)
  const sharedSecretBuffer = new Buffer(getHexFromBN(sharedSecret), 'hex')

  const sharedKeys = sharedSecretToKeys(sharedSecretBuffer)

  const ivBuffer = new Buffer(cipherObject.iv, 'hex')
  const cipherTextBuffer = new Buffer(cipherObject.cipherText, 'hex')

  const macData = Buffer.concat([ivBuffer,
                                 new Buffer(ephemeralPK.encodeCompressed()),
                                 cipherTextBuffer])
  const actualMac = hmacSha256(sharedKeys.hmacKey, macData)
  const expectedMac = new Buffer(cipherObject.mac, 'hex')
  if (! equalConstTime(expectedMac, actualMac)) {
    throw new Error('Decryption failed: failure in MAC check')
  }
  const plainText = aes256CbcDecrypt(
    ivBuffer, sharedKeys.encryptionKey, cipherTextBuffer)

  if (cipherObject.wasString) {
    return plainText.toString()
  } else {
    return plainText
  }
}

/**
 * Sign content using ECDSA
 * @param {String} privateKey - secp256k1 private key hex string
 * @param {Object} content - content to sign
 * @return {Object} contains:
 * signature - Hex encoded DER signature
 * public key - Hex encoded private string taken from privateKey
 */
export function signECDSA(privateKey: string, content: string | Buffer)
: {publicKey: string, signature: string } {
  const contentBuffer = Buffer.from(content)
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
 * Verify content using ECDSA
 * @param {String | Buffer} content - Content to verify was signed
 * @param {String} publicKey - secp256k1 private key hex string
 * @param {String} signature - Hex encoded DER signature
 * @return {Boolean} returns true when signature matches publickey + content, false if not
 */
export function verifyECDSA(content: string | Buffer,
                            publicKey: string,
                            signature: string) {
  const contentBuffer = Buffer.from(content)
  const ecPublic = ecurve.keyFromPublic(publicKey, 'hex')
  const contentHash = crypto.createHash('sha256').update(contentBuffer).digest()

  return ecPublic.verify(contentHash, signature)
}

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 */
export function encryptMnemonic(phrase: string, password: string) {
  return Promise.resolve().then(() => {
    // must be bip39 mnemonic
    if (!bip39.validateMnemonic(phrase)) {
      throw new Error('Not a valid bip39 nmemonic')
    }

    // normalize plaintext to fixed length byte string
    const plaintextNormalized = Buffer.from(
      bip39.mnemonicToEntropy(phrase).toString('hex'), 'hex'
    )

    // AES-128-CBC with SHA256 HMAC
    const salt = crypto.randomBytes(16)
    const keysAndIV = crypto.pbkdf2Sync(password, salt, 100000, 48, 'sha512')
    const encKey = keysAndIV.slice(0, 16)
    const macKey = keysAndIV.slice(16, 32)
    const iv = keysAndIV.slice(32, 48)

    const cipher = crypto.createCipheriv('aes-128-cbc', encKey, iv)
    let cipherText = cipher.update(plaintextNormalized).toString('hex')
    cipherText += cipher.final().toString('hex')

    const hmacPayload = Buffer.concat([salt, Buffer.from(cipherText, 'hex')])

    const hmac = crypto.createHmac('sha256', macKey)
    hmac.write(hmacPayload)
    const hmacDigest = hmac.digest()

    const payload = Buffer.concat([salt, hmacDigest, Buffer.from(cipherText, 'hex')])
    return payload
  })
}

// Used to distinguish bad password during decrypt vs invalid format
class PasswordError extends Error {}

function decryptMnemonicBuffer(dataBuffer: Buffer, password: string) {
  return Promise.resolve().then(() => {
    const salt = dataBuffer.slice(0, 16)
    const hmacSig = dataBuffer.slice(16, 48)   // 32 bytes
    const cipherText = dataBuffer.slice(48)
    const hmacPayload = Buffer.concat([salt, cipherText])

    const keysAndIV = crypto.pbkdf2Sync(password, salt, 100000, 48, 'sha512')
    const encKey = keysAndIV.slice(0, 16)
    const macKey = keysAndIV.slice(16, 32)
    const iv = keysAndIV.slice(32, 48)

    const decipher = crypto.createDecipheriv('aes-128-cbc', encKey, iv)
    let plaintext = decipher.update(cipherText).toString('hex')
    plaintext += decipher.final().toString('hex')

    const hmac = crypto.createHmac('sha256', macKey)
    hmac.write(hmacPayload)
    const hmacDigest = hmac.digest()

    // hash both hmacSig and hmacDigest so string comparison time
    // is uncorrelated to the ciphertext
    const hmacSigHash = crypto.createHash('sha256')
      .update(hmacSig)
      .digest()
      .toString('hex')

    const hmacDigestHash = crypto.createHash('sha256')
      .update(hmacDigest)
      .digest()
      .toString('hex')

    if (hmacSigHash !== hmacDigestHash) {
      // not authentic
      throw new PasswordError('Wrong password (HMAC mismatch)')
    }

    const mnemonic = bip39.entropyToMnemonic(plaintext)
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new PasswordError('Wrong password (invalid plaintext)')
    }

    return mnemonic
  })
}


/**
 * Decrypt legacy triplesec keys
 * @param {Buffer} dataBuffer - The encrypted key
 * @param {String} password - Password for data
 * @return {Promise<Buffer>} Decrypted seed
 */
function decryptLegacy(dataBuffer: Buffer, password: string) {
  return new Promise((resolve, reject) => {
    triplesec.decrypt(
      {
        key: Buffer.from(password),
        data: dataBuffer
      },
      (err, plaintextBuffer) => {
        if (!err) {
          resolve(plaintextBuffer)
        } else {
          reject(err)
        }
      }
    )
  })
}

/**
 * Encrypt a raw mnemonic phrase with a password
 * @param {string | Buffer} data - Buffer or hex-encoded string of the encrypted mnemonic
 * @param {string} password - Password for data
 * @return {Promise<Buffer>} the raw mnemonic phrase
 */
export function decryptMnemonic(data: string | Buffer, password: string) {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex')
  return decryptMnemonicBuffer(dataBuffer, password).catch((err) => {
    // If it was a password error, don't even bother with legacy
    if (err instanceof PasswordError) {
      throw err
    }

    return decryptLegacy(dataBuffer, password)
  })
}
