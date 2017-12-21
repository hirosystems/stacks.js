/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, generateAppIndexFilePath,
         BLOCKSTACK_GAIA_HUB_LABEL, APP_INDEX_FILE_NAME } from './hub'

import { encryptECIES, decryptECIES } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate } from '../keys'
import { lookupProfile } from '../profiles'

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
      if (decrypt && storedContents !== null) {
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
 * Get the the read URL of a stored file
 * @param {String} path - the file path to retrieve read URL for
 * @returns {Promise} That resolves to the read URL of the specified file
 */
export function getFileReadUrl(path: string) {
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => getFullReadUrl(path, gaiaHubConfig))
}


/**
 * Get the app index file URL
 * @param {String} gaiaHubUrl - the gaia hub url to generate index file url for
 * @param {String} appPrivateKey - the app private key used to generate the app address
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
export function getAppIndexFileUrl(gaiaHubUrl: string, appPrivateKey: string) {
  return generateAppIndexFilePath(gaiaHubUrl, appPrivateKey)
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
 * @param {string} [zoneFileLookupURL=http://localhost:6270/v1/names/] The URL
 * to use for zonefile lookup
 * @return {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getUserAppIndex(name: string, appOrigin: string, zoneFileLookupURL: string = 'http://localhost:6270/v1/names/') {
  return lookupProfile(name, zoneFileLookupURL)
    .then(profile => {
      if (profile.hasOwnProperty('apps')) {
        if (profile.apps.hasOwnProperty(appOrigin)) {
          const appIndexFileURL = profile.apps[appOrigin]
          return appIndexFileURL
        } else {
          return null
        }
      } else {
        return null
      }
    })
    .then((appIndexFileURL) => fetch(appIndexFileURL))
    .then((response) => {
      if (response.status !== 200) {
        if (response.status === 404) {
          console.log(`getUserAppIndex ${response.url} returned 404, returning null`)
          return null
        } else {
          throw new Error(`getUserAppIndex ${response.url} failed with status ${response.status}`)
        }
      }
      const contentType = response.headers.get('Content-Type')
      if (contentType === null ||
          contentType.startsWith('text') ||
          contentType === 'application/json') {
        return response.text()
      } else {
        return response.arrayBuffer()
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
