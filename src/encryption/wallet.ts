import * as crypto from 'crypto'
import * as bip39 from 'bip39'
import * as triplesec from 'triplesec'

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 * @private
 * @ignore 
 * */
export function encryptMnemonic(phrase: string, password: string) {
  return Promise.resolve().then(() => {
    // must be bip39 mnemonic
    if (!bip39.validateMnemonic(phrase)) {
      throw new Error('Not a valid bip39 nmemonic')
    }

    // normalize plaintext to fixed length byte string
    const plaintextNormalized = Buffer.from(
      bip39.mnemonicToEntropy(phrase), 'hex'
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
class PasswordError extends Error { }

/**
* @ignore
*/
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
 * @private
 * @ignore 
 */
function decryptLegacy(dataBuffer: Buffer, password: string) {
  return new Promise<Buffer>((resolve, reject) => {
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
 * @return {Promise<string>} the raw mnemonic phrase
 * @private
 * @ignore 
 */
export function decryptMnemonic(data: (string | Buffer), password: string): Promise<string> {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex')
  return decryptMnemonicBuffer(dataBuffer, password).catch((err) => {
    // If it was a password error, don't even bother with legacy
    if (err instanceof PasswordError) {
      throw err
    }
    return decryptLegacy(dataBuffer, password).then(data => data.toString())
  })
}
