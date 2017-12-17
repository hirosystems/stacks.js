/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, APP_INDEX_FILE_NAME, 
         BLOCKSTACK_GAIA_HUB_LABEL } from './hub'

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
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => fetch(getFullReadUrl(path, gaiaHubConfig)))
    .then((response) => {
      if (response.status !== 200) {
        if (response.status === 404) {
          console.log(`getFile ${path} returned 404, returning null`)
          return null
        } else {
          throw new Error(`getFile ${path} failed with HTTP status ${response.status}`)
        }
      }
      const contentType = response.headers.get('Content-Type')
      if (contentType === null || decrypt ||
          contentType.startsWith('text') ||
          contentType === 'application/json') {
        return response.text()
      } else {
        return response.arrayBuffer()
      }
    })
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
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Boolean} encrypt - encrypt the data with the app private key
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, encrypt: boolean = false) {
  let contentType = 'text/plain'
  if (typeof(content) !== 'string') {
    contentType = 'application/octet-stream'
  }
  if (encrypt) {
    const privateKey = loadUserData().appPrivateKey
    const publicKey = getPublicKeyFromPrivate(privateKey)
    const cipherObject = encryptECIES(publicKey, content)
    content = JSON.stringify(cipherObject)
    contentType = 'application/json'
  }
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => uploadToGaiaHub(path, content, gaiaHubConfig, contentType))
}

/**
 * Stores the app index file which enables multi-reader storage. This file 
 * will be written to the user's profile and publicly visible if the `appIndex` 
 * scope was requested during authentication.
 * @param {String|Buffer} content - the data to store in the file
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putIndexFile(content: string | Buffer) {
  const filename = APP_INDEX_FILE_NAME
  return this.putFile(APP_INDEX_FILE_NAME, content, false)
}

/**
 * Deletes the specified file from the app's data store.
 * @param {String} path - the path to the file to delete
 * @returns {Promise} that resolves when the file has been removed
 * or rejects with an error
 */
export function deleteFile(path: string) {
  throw new Error(`Delete of ${path} not supported by gaia hubs`)
}

export { connectToGaiaHub, uploadToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL, GaiaHubConfig }

