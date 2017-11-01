'use strict'

// import test from 'tape'
import test from 'tape-promise/tape'

import {
 encryptECIES, decryptECIES
} from '../../../lib/encryption'

import { sampleManifests, sampleProfiles, sampleNameRecords } from './sampleData'

export function runEncryptionTests() {
  const privateKey = 'a5c61c6ca7b3e7e55edee68566aeab22e4da26baa285c7bd10e8d2218aa3b229'
  const publicKey = '027d28f9951ce46538951e3697c62588a87f1f1f295de4a14fdd4c780fc52cfe69'
  const nameLookupURL = 'https://explorer-api.appartisan.com/get_name_blockchain_record/'

  test('encrypt-to-decrypt works', (t) => {
    t.plan(2)

    let testString = "all work and no play makes jack a dull boy"
    let cipherObj = encryptECIES(publicKey, testString)
    let deciphered = decryptECIES(privateKey, cipherObj)
    t.equal(deciphered, testString, 'Decrypted ciphertext does not match expected plaintext')

    let testBuffer = new Buffer(testString)
    cipherObj = encryptECIES(publicKey, testBuffer)
    deciphered = decryptECIES(privateKey, cipherObj)
    t.equal(deciphered.toString('hex'), testBuffer.toString('hex'),
            'Decrypted cipherbuffer does not match expected plainbuffer')
  })

  test('encrypt-to-decrypt fails on bad mac', (t) => {
    t.plan(1)

    let testString = "all work and no play makes jack a dull boy"
    let cipherObj = encryptECIES(publicKey, testString)
    let evilString = "some work and some play makes jack a dull boy"
    let evilObj = encryptECIES(publicKey, evilString)

    cipherObj.cipherText = evilObj.cipherText

    try {
      decryptECIES(privateKey, cipherObj)
      t.true(false, 'Decryption should have failed when ciphertext modified')
    } catch (e) {
      t.true(true, 'Decryption correctly fails when ciphertext modified')
    }
  })
}
