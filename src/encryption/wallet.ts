import { validateMnemonic, mnemonicToEntropy, entropyToMnemonic } from 'bip39'
import { randomBytes } from './cryptoRandom'
import { createSha2Hash } from './sha2Hash'
import { createHmacSha256 } from './hmacSha256'
import { createCipher } from './aesCipher'
import { createPbkdf2 } from './pbkdf2'
import { TriplesecDecryptSignature } from './cryptoUtils'

/**
 * Encrypt a raw mnemonic phrase to be password protected
 * @param {string} phrase - Raw mnemonic phrase
 * @param {string} password - Password to encrypt mnemonic with
 * @return {Promise<Buffer>} The encrypted phrase
 * @private
 * @ignore 
 * */
export async function encryptMnemonic(phrase: string, password: string): Promise<Buffer> {
  // must be bip39 mnemonic
  if (!validateMnemonic(phrase)) {
    throw new Error('Not a valid bip39 nmemonic')
  }

  // normalize plaintext to fixed length byte string
  const plaintextNormalized = Buffer.from(
    mnemonicToEntropy(phrase), 'hex'
  )

  // AES-128-CBC with SHA256 HMAC
  const pbkdf2 = await createPbkdf2()
  const salt = randomBytes(16)
  const keysAndIV = await pbkdf2.derive(password, salt, 100000, 48, 'sha512')
  const encKey = keysAndIV.slice(0, 16)
  const macKey = keysAndIV.slice(16, 32)
  const iv = keysAndIV.slice(32, 48)

  const cipher = await createCipher()
  const cipherText = await cipher.encrypt('aes-128-cbc', encKey, iv, plaintextNormalized)

  const hmacPayload = Buffer.concat([salt, cipherText])
  const hmacSha256 = await createHmacSha256()
  const hmacDigest = await hmacSha256.digest(macKey, hmacPayload)

  const payload = Buffer.concat([salt, hmacDigest, cipherText])
  return payload
}

// Used to distinguish bad password during decrypt vs invalid format
class PasswordError extends Error { }

/**
* @ignore
*/
async function decryptMnemonicBuffer(dataBuffer: Buffer, password: string) {
  const salt = dataBuffer.slice(0, 16)
  const hmacSig = dataBuffer.slice(16, 48)   // 32 bytes
  const cipherText = dataBuffer.slice(48)
  const hmacPayload = Buffer.concat([salt, cipherText])

  const pbkdf2 = await createPbkdf2()
  const keysAndIV = await pbkdf2.derive(password, salt, 100000, 48, 'sha512')
  const encKey = keysAndIV.slice(0, 16)
  const macKey = keysAndIV.slice(16, 32)
  const iv = keysAndIV.slice(32, 48)

  const decipher = await createCipher()
  const decryptedResult = await decipher.decrypt('aes-128-cbc', encKey, iv, cipherText)
  const plaintext = decryptedResult.toString('hex')

  const hmacSha256 = await createHmacSha256()
  const hmacDigest = await hmacSha256.digest(macKey, hmacPayload)

  // hash both hmacSig and hmacDigest so string comparison time
  // is uncorrelated to the ciphertext
  const sha2Hash = await createSha2Hash()
  const hmacSigHash = (await sha2Hash.digest(hmacSig)).toString('hex')
  const hmacDigestHash = (await sha2Hash.digest(hmacDigest)).toString('hex')

  if (hmacSigHash !== hmacDigestHash) {
    // not authentic
    throw new PasswordError('Wrong password (HMAC mismatch)')
  }

  const mnemonic = entropyToMnemonic(plaintext)
  if (!validateMnemonic(mnemonic)) {
    throw new PasswordError('Wrong password (invalid plaintext)')
  }

  return mnemonic
}


/**
 * Decrypt legacy triplesec keys
 * @param {Buffer} dataBuffer - The encrypted key
 * @param {String} password - Password for data
 * @return {Promise<Buffer>} Decrypted seed
 * @private
 * @ignore 
 */
function decryptLegacy(
  dataBuffer: Buffer, 
  password: string, 
  triplesecDecrypt: TriplesecDecryptSignature): 
  Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    triplesecDecrypt(
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
export async function decryptMnemonic(
  data: (string | Buffer), 
  password: string, 
  triplesecDecrypt: TriplesecDecryptSignature): 
  Promise<string> {
  const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'hex')
  try {
    return await decryptMnemonicBuffer(dataBuffer, password)
  } catch (err) {
    // If it was a password error, don't even bother with legacy
    if (err instanceof PasswordError) {
      throw err
    }
    const data = await decryptLegacy(dataBuffer, password, triplesecDecrypt)
    return data.toString()
  }
}
