import { ec as EllipticCurve } from 'elliptic'
import crypto from 'crypto'

const ecurve = new EllipticCurve('secp256k1')

function aes256CbcEncrypt(iv : Buffer, key : Buffer, plaintext : Buffer) {
  var cipher = crypto.createCipheriv("aes-256-cbc", key, iv)
  var firstChunk = cipher.update(plaintext)
  var secondChunk = cipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

function aes256CbcDecrypt(iv : Buffer, key : Buffer, ciphertext : Buffer) {
  var cipher = crypto.createDecipheriv("aes-256-cbc", key, iv)
  var firstChunk = cipher.update(ciphertext)
  var secondChunk = cipher.final()
  return Buffer.concat([firstChunk, secondChunk])
}

function hmacSha256(key : Buffer, content : Buffer) {
  return crypto.createHmac("sha256", key).update(content).digest()
}

function sha512(content : Buffer) {
  return crypto.createHash('sha512').update(content).digest()
}

function equalConstTime(b1 : Buffer, b2 : Buffer) {
  if (b1.length !== b2.length) {
    return false;
  }
  var res = 0;
  for (var i = 0; i < b1.length; i++) {
    res |= b1[i] ^ b2[i];  // jshint ignore:line
  }
  return res === 0;
}

function sharedSecretToKeys(sharedSecret : Buffer) {
  // generate mac and encryption key from shared secret
  const hashedSecret = sha512(sharedSecret)
  return { encryptionKey : hashedSecret.slice(0, 32),
           hmacKey : hashedSecret.slice(32) }
}


/**
 * Encrypt content to elliptic curve publicKey using ECIES
 * @param {String} secp256k1 public key hex string
 * @param {String | Buffer} content to encrypt
 * @return {Object} Object containing (hex encoded):
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeral public key
 */
export function encryptECIES(publicKey: string, content: string | Buffer) {
  const plainText = (typeof(content) == 'string') ? new Buffer(content) : content
  const ecPK = ecurve.keyFromPublic(publicKey, 'hex').getPublic()
  const ephemeralSK = ecurve.genKeyPair()
  const ephemeralPK = ephemeralSK.getPublic()

  const sharedSecret = ephemeralSK.derive(ecPK)
  const sharedKeys = sharedSecretToKeys(sharedSecret.toBuffer())

  const initializationVector = crypto.randomBytes(16)

  const cipherText = aes256CbcEncrypt(
    initializationVector, sharedKeys.encryptionKey, plainText)

  const macData = Buffer.concat([initializationVector,
                                 new Buffer(ephemeralPK.encodeCompressed()),
                                 cipherText])
  const mac = hmacSha256(sharedKeys.hmacKey, macData)

  return { iv : initializationVector.toString('hex'),
           ephemeralPK : ephemeralPK.encodeCompressed('hex'),
           cipherText : cipherText.toString('hex'),
           mac : mac.toString('hex') }
}

/**
 * Decrypt content encrypted using ECIES
 * @param {String} secp256k1 private key hex string
 * @param {Object} encrypted cipherObject to decrypt, should contain:
 *  iv (initialization vector), cipherText (cipher text),
 *  mac (message authentication code), ephemeralPublicKey
 * @return {Buffer} plaintext, or false if error
 */
export function decryptECIES(privateKey: string, cipherObject: string ) {
  const ecSK = ecurve.keyFromPrivate(privateKey, 'hex')
  const ephemeralPK = ecurve.keyFromPublic(cipherObject.ephemeralPK, 'hex').getPublic()
  const sharedSecret = ecSK.derive(ephemeralPK)
  const sharedKeys = sharedSecretToKeys(sharedSecret.toBuffer())

  const ivBuffer = new Buffer(cipherObject.iv, 'hex')
  const cipherTextBuffer = new Buffer(cipherObject.cipherText, 'hex')

  const macData = Buffer.concat([ivBuffer,
                                 new Buffer(ephemeralPK.encodeCompressed()),
                                 cipherTextBuffer])
  const actualMac = hmacSha256(sharedKeys.hmacKey, macData)
  if (! equalConstTime(new Buffer(cipherObject.mac, 'hex'), actualMac)){
    throw 'Decryption failed: failure in MAC check'
  }
  return aes256CbcDecrypt(ivBuffer, sharedKeys.encryptionKey, cipherTextBuffer)
}
