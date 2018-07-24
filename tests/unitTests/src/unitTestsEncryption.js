import test from 'tape-promise/tape'

import elliptic from 'elliptic'
import {
  encryptECIES, decryptECIES, getHexFromBN, signECDSA, verifyECDSA
} from '../../../lib/encryption'


export function runEncryptionTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

  test('encrypt-to-decrypt works', (t) => {
    t.plan(2)

    const testString = 'all work and no play makes jack a dull boy'
    let cipherObj = encryptECIES(publicKey, testString)
    let deciphered = decryptECIES(privateKey, cipherObj)
    t.equal(deciphered, testString, 'Decrypted ciphertext does not match expected plaintext')

    const testBuffer = new Buffer(testString)
    cipherObj = encryptECIES(publicKey, testBuffer)
    deciphered = decryptECIES(privateKey, cipherObj)
    t.equal(deciphered.toString('hex'), testBuffer.toString('hex'),
            'Decrypted cipherbuffer does not match expected plainbuffer')
  })

  test('encrypt-to-decrypt fails on bad mac', (t) => {
    t.plan(1)

    const testString = 'all work and no play makes jack a dull boy'
    const cipherObj = encryptECIES(publicKey, testString)
    const evilString = 'some work and some play makes jack a dull boy'
    const evilObj = encryptECIES(publicKey, evilString)

    cipherObj.cipherText = evilObj.cipherText

    try {
      decryptECIES(privateKey, cipherObj)
      t.true(false, 'Decryption should have failed when ciphertext modified')
    } catch (e) {
      t.true(true, 'Decryption correctly fails when ciphertext modified')
    }
  })

  test('sign-to-verify-works', (t) => {
    t.plan(2)

    const testString = 'all work and no play makes jack a dull boy'
    let sigObj = signECDSA(privateKey, testString)
    t.true(verifyECDSA(testString, sigObj.publicKey, sigObj.signature),
           'String content should be verified')

    const testBuffer = new Buffer(testString)
    sigObj = signECDSA(privateKey, testBuffer)
    t.true(verifyECDSA(testBuffer, sigObj.publicKey, sigObj.signature),
           'String buffer should be verified')
  })

  test('sign-to-verify-fails', (t) => {
    t.plan(3)

    const testString = 'all work and no play makes jack a dull boy'
    const failString = 'I should fail'

    let sigObj = signECDSA(privateKey, testString)
    t.false(verifyECDSA(failString, sigObj.publicKey, sigObj.signature),
            'String content should not be verified')

    const testBuffer = Buffer.from(testString)
    sigObj = signECDSA(privateKey, testBuffer)
    t.false(verifyECDSA(Buffer.from(failString), sigObj.publicKey, sigObj.signature),
            'Buffer content should not be verified')

    const badPK = '0288580b020800f421d746f738b221d384f098e911b81939d8c94df89e74cba776'
    sigObj = signECDSA(privateKey, testBuffer)
    t.false(verifyECDSA(Buffer.from(failString), badPK, sigObj.signature),
            'Buffer content should not be verified')
  })

  test('bn-padded-to-64-bytes', (t) => {
    t.plan(1)
    const ecurve = new elliptic.ec('secp256k1')

    const evilHexes = ['ba40f85b152bea8c3812da187bcfcfb0dc6e15f9e27cb073633b1c787b19472f',
                       'e346010f923f768138152d0bad063999ff1da5361a81e6e6f9106241692a0076']
    const results = evilHexes.map((hex) => {
      const ephemeralSK = ecurve.keyFromPrivate(hex)
      const ephemeralPK = ephemeralSK.getPublic()
      const sharedSecret = ephemeralSK.derive(ephemeralPK)
      return getHexFromBN(sharedSecret).length === 64
    })

    t.true(results.every(x => x), 'Evil hexes must all generate 64-len hex strings')
  })
}
