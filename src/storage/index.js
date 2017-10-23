/* @flow */
import { getFile as storageGetFile,
  putFile as storagePutFile } from 'blockstack-storage'

import { encryptECIES, decryptECIES } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate } from '../keys'

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Boolean} decrypt - try to decrypt the data with the app private key
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(path: string, decrypt: boolean = false) {
  return storageGetFile(path)
    .then((storedContents) => {
      if (decrypt) {
        const privateKey = loadUserData().appPrivateKey
        const cipherObject = JSON.parse(storedContents)
        return decryptECIES(privateKey, cipherObject)
      } else {
        return storedContents
      }
    })
}

/**
 * Encrypt the data provided in the app's data store to to the Object passed.
 * @param {String|Buffer} content - the data to store in the file
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function encryptContent(content: string | Buffer) {
  const privateKey = loadUserData().appPrivateKey
  const publicKey = getPublicKeyFromPrivate(privateKey)
  const cipherObject = encryptECIES(publicKey, content)
  return JSON.stringify(cipherObject)
}

/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Boolean} encrypt - encrypt the data with the app private key
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, encrypt: boolean = false) {
  if (encrypt) {
    content = encryptContent(content)
  }
  return storagePutFile(path, content)
}
