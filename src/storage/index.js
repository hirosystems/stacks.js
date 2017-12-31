/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, generateAppIndexFilePath,
         BLOCKSTACK_GAIA_HUB_LABEL, APP_INDEX_FILE_NAME } from './hub'

import { encryptECIES, decryptECIES } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate } from '../keys'
import { lookupProfile } from '../profiles'

const APP_INDEX_FILES_KEY = 'files'

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.decrypt=false] - try to decrypt the data with the app private key
 * @param {String} options.user - the Blockstack ID to lookup for multi-player storage
 * @param {String} options.app - the app to lookup for multi-player storage
 * @param {String} [options.zoneFileLookupURL=http://localhost:6270/v1/names/] - the blockstack 
 * core endpoint url to use for zonefile lookup
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(path: string, options?: {decrypt?: boolean, user?: string, app?: string, 
  zoneFileLookupURL?: string}) {
  const defaults = {
    decrypt: false,
    user: null,
    app: null,
    zoneFileLookupURL: 'http://localhost:6270/v1/names/'
  }

  const opt = Object.assign({}, defaults, options)

  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => {
      if (opt.user && opt.app) {
        return this.getUserAppFileUrl(path, opt.user, opt.app, opt.zoneFileLookupURL)
      } else {
        return getFullReadUrl(path, gaiaHubConfig)
      }
    })
    .then((readUrl) => new Promise((resolve, reject) => {
      if (!readUrl) {
        reject(null)
      } else {
        resolve(readUrl)
      }
    }))
    .then((readUrl) => {
      return fetch(readUrl)
    })
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
      if (contentType === null || opt.decrypt ||
          contentType.startsWith('text') ||
          contentType === 'application/json') {
        return response.text()
      } else {
        return response.arrayBuffer()
      }
    })
    .then((storedContents) => {
      if (opt.decrypt && storedContents !== null) {
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
 * @param {Object} [options=null]- options object
 * @param {Boolean} [options.encrypt=false] - encrypt the data with the app private key
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, options?: {encrypt?: boolean,
  public?: boolean}) {
  const defaults = {
    encrypt: false,
    public: false
  }

  const opt = Object.assign({}, defaults, options)

  let contentType = 'text/plain'
  if (typeof(content) !== 'string') {
    contentType = 'application/octet-stream'
  }
  if (opt.encrypt) {
    const privateKey = loadUserData().appPrivateKey
    const publicKey = getPublicKeyFromPrivate(privateKey)
    const cipherObject = encryptECIES(publicKey, content)
    content = JSON.stringify(cipherObject)
    contentType = 'application/json'
  }
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => uploadToGaiaHub(path, content, gaiaHubConfig, contentType))
    .then((publicUrl) => {
      if (opt.public) {
        return this.addToAppIndex(path, publicUrl)
      } else {
        return publicUrl
      }
    })
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
 * Adds the public URL of a file to the app index file under the `files` property
 * @param {String} path - the file path
 * @param {String} publicUrl - the public URL of the file
 * @returns {Promise} That resolves to the public URL of the specified file
 */
export function addToAppIndex(path: string, publicUrl: string) {
  return this.getAppIndexFile(path)
    .then((appIndexJSON) => {
      let newAppIndex = {}
      if (!appIndexJSON) {
        newAppIndex = { [APP_INDEX_FILES_KEY]: { [path]: publicUrl } }
      } else {
        const appIndex = JSON.parse(appIndexJSON)
        const newFiles = Object.assign({}, appIndex.files, { [path]: publicUrl })

        newAppIndex = appIndex
        newAppIndex[APP_INDEX_FILES_KEY] = newFiles
      }
      return this.putAppIndexFile(JSON.stringify(newAppIndex))
    })
    .then(() => publicUrl)
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
  return this.putFile(APP_INDEX_FILE_NAME, content)
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
 * Fetch the public file read url for the specified user and app.
 * @param {String} path - the path to the file to read
 * @param {String} name - The blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {string} [zoneFileLookupURL=http://localhost:6270/v1/names/] The URL
 * to use for zonefile lookup
 * @return {Promise} that resolves to the public read url of the file
 * or rejects with an error
 */
export function getUserAppFileUrl(path: string, name: string, appOrigin: string, 
  zoneFileLookupURL: string = 'http://localhost:6270/v1/names/') {
  return getUserAppIndex(name, appOrigin, zoneFileLookupURL)
    .then((appIndexFileJSON) => {
      const appIndexFile = JSON.parse(appIndexFileJSON)
      if (appIndexFile.hasOwnProperty(APP_INDEX_FILES_KEY)) {
        return appIndexFile.files[path]
      } else {
        throw new Error(`getUserAppFileUrl ${path} app index does not contain files key`)
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
