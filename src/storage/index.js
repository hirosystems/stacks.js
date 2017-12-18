/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL } from './hub'

import { encryptECIES, decryptECIES } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate } from '../keys'
import { lookupProfile } from '../profiles'

const APP_INDEX_FILE_NAME = 'app_index.json'

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
 * Get the app index file URL
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
export function getAppIndexFileUrl(): string {
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => `${gaiaHubConfig.url_prefix}${gaiaHubConfig.address}/${APP_INDEX_FILE_NAME}`)
}

/**
 * Retrieves the app index file from the app's data store.
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getAppIndexFile() {
  return this.getFile(APP_INDEX_FILE_NAME)
}

/**
 * Stores the app index file which enables multi-reader storage. This file 
 * will be publicly visible in the user's profile data if the `appIndex` 
 * scope was requested during authentication.
 * @param {String|Buffer} content - the data to store in the file
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putAppIndexFile(content: string | Buffer) {
  return this.putFile(APP_INDEX_FILE_NAME, content, false)
}

/**
 * Fetch the app index file for the specified user and app. 
 * @param {String} name - The blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {string} [profileLookupURL=https://core.blockstack.org/v2/users/] The URL
 * to use for profile lookup 
 * @return {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getUserAppIndex(name: string, appOrigin: string, profileLookupURL: string = 'https://core.blockstack.org/v2/users/') {
  return lookupProfile(name, profileLookupURL)
    .then(profile => {
      if (profile.hasOwnProperty('apps')) {
        if (profile.apps.hasOwnProperty(appOrigin)) {
          const appIndexFileURL =  profile.apps[appOrigin]
          return fetch(appIndexFileURL)
        } else {
          return null
        }
      } else {
        return null
      }
    })
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

