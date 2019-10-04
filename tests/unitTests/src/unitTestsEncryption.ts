import * as test from 'tape-promise/tape'
import * as triplesec from 'triplesec'
import * as elliptic from 'elliptic'
import {
  encryptECIES, decryptECIES, getHexFromBN, signECDSA,
  verifyECDSA,  encryptMnemonic, decryptMnemonic
} from '../../../src/encryption'
import { ERROR_CODES } from '../../../src/errors'

export function runEncryptionTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'

  test('encrypt-to-decrypt works', async (t) => {
    t.plan(2)

    const testString = 'all work and no play makes jack a dull boy'
    let cipherObj = await encryptECIES(publicKey, testString)
    let deciphered = await decryptECIES(privateKey, cipherObj)
    t.equal(deciphered, testString, 'Decrypted ciphertext does not match expected plaintext')

    const testBuffer = Buffer.from(testString)
    cipherObj = await encryptECIES(publicKey, testBuffer)
    deciphered = await decryptECIES(privateKey, cipherObj)
    t.equal(deciphered.toString('hex'), testBuffer.toString('hex'),
            'Decrypted cipherbuffer does not match expected plainbuffer')
  })

  test('encrypt-to-decrypt fails on bad mac', async (t) => {
    t.plan(3)

    const testString = 'all work and no play makes jack a dull boy'
    const cipherObj = await encryptECIES(publicKey, testString)
    const evilString = 'some work and some play makes jack a dull boy'
    const evilObj = await encryptECIES(publicKey, evilString)

    cipherObj.cipherText = evilObj.cipherText

    try {
      await decryptECIES(privateKey, cipherObj)
      t.true(false, 'Decryption should have failed when ciphertext modified')
    } catch (e) {
      t.true(true, 'Decryption correctly fails when ciphertext modified')
      t.equal(e.code, ERROR_CODES.FAILED_DECRYPTION_ERROR, 'Must have proper error code')
      const assertionMessage = 'Should indicate MAC error'
       t.notEqual(e.message.indexOf('failure in MAC check'), -1, assertionMessage)
    }
  })

  test('sign-to-verify-works', async (t) => {
    t.plan(2)

    const testString = 'all work and no play makes jack a dull boy'
    let sigObj = await signECDSA(privateKey, testString)
    t.true(await verifyECDSA(testString, sigObj.publicKey, sigObj.signature),
           'String content should be verified')

    const testBuffer = Buffer.from(testString)
    sigObj = await signECDSA(privateKey, testBuffer)
    t.true(await verifyECDSA(testBuffer, sigObj.publicKey, sigObj.signature),
           'String buffer should be verified')
  })

  test('sign-to-verify-fails', async (t) => {
    t.plan(3)

    const testString = 'all work and no play makes jack a dull boy'
    const failString = 'I should fail'

    let sigObj = await signECDSA(privateKey, testString)
    t.false(await verifyECDSA(failString, sigObj.publicKey, sigObj.signature),
            'String content should not be verified')

    const testBuffer = Buffer.from(testString)
    sigObj = await signECDSA(privateKey, testBuffer)
    t.false(await verifyECDSA(Buffer.from(failString), sigObj.publicKey, sigObj.signature),
            'Buffer content should not be verified')

    const badPK = '0288580b020800f421d746f738b221d384f098e911b81939d8c94df89e74cba776'
    sigObj = await signECDSA(privateKey, testBuffer)
    t.false(await verifyECDSA(Buffer.from(failString), badPK, sigObj.signature),
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

  test('encryptMnemonic & decryptMnemonic', async (t) => {

    const rawPhrase = 'march eager husband pilot waste rely exclude taste '
      + 'twist donkey actress scene'
    const rawPassword = 'testtest'

    const preEncryptedPhrase = '7573f4f51089ba7ce2b95542552b7504de7305398637733'
     + '0579649dfbc9e664073ba614fac180d3dc237b21eba57f9aee5702ba819fe17a0752c4dc7'
     + '94884c9e75eb60da875f778bbc1aaca1bd373ea3'

    const legacyPhrase = 'vivid oxygen neutral wheat find thumb cigar wheel '
      + 'board kiwi portion business'
    const legacyPassword = 'supersecret'
    const legacyEncrypted = '1c94d7de0000000304d583f007c71e6e5fef354c046e8c64b1'
      + 'adebd6904dcb007a1222f07313643873455ab2a3ab3819e99d518cc7d33c18bde02494aa'
      + '74efc35a8970b2007b2fc715f6067cee27f5c92d020b1806b0444994aab80050a6732131'
      + 'd2947a51bacb3952fb9286124b3c2b3196ff7edce66dee0dbd9eb59558e0044bddb3a78f'
      + '48a66cf8d78bb46bb472bd2d5ec420c831fc384293252459524ee2d668869f33c586a944'
      + '67d0ce8671260f4cc2e87140c873b6ca79fb86c6d77d134d7beb2018845a9e71e6c7ecde'
      + 'dacd8a676f1f873c5f9c708cc6070642d44d2505aa9cdba26c50ad6f8d3e547fb0cba710'
      + 'a7f7be54ff7ea7e98a809ddee5ef85f6f259b3a17a8d8dbaac618b80fe266a1e63ec19e4'
      + '76bee9177b51894ee'

    // Test encryption -> decryption. Can't be done with hard-coded values
    // due to random salt.
    // TODO: Use generators to allow for inserting the same salt for testing?
    await encryptMnemonic(rawPhrase, rawPassword)
      .then(encoded => decryptMnemonic(encoded.toString('hex'), rawPassword, triplesec.decrypt),
            (err) => {
              t.fail(`Should encrypt mnemonic phrase, instead errored: ${err}`)
            })
      .then((decoded: string) => {
        t.true(decoded.toString() === rawPhrase, 'Should encrypt & decrypt a phrase correctly')
      }, (err) => {
        t.fail(`Should decrypt encrypted phrase, instead errored: ${err}`)
      })

    // Test valid input (No salt, so it's the same every time)
    await decryptMnemonic(legacyEncrypted, legacyPassword, triplesec.decrypt).then((decoded) => {
      t.true(decoded.toString() === legacyPhrase, 'Should decrypt legacy encrypted phrase')
    }, (err) => {
      t.fail(`Should decrypt legacy encrypted phrase, instead errored: ${err}`)
    })

    // Invalid inputs
    await encryptMnemonic('not a mnemonic phrase', 'password').then(() => {
      t.fail('Should have thrown on invalid mnemonic input')
    }, () => {
      t.pass('Should throw on invalid mnemonic input')
    })

    await decryptMnemonic(preEncryptedPhrase, 'incorrect password', triplesec.decrypt).then(() => {
      t.fail('Should have thrown on incorrect password for decryption')
    }, () => {
      t.pass('Should throw on incorrect password')
    })
  })
}
