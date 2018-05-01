/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, getBucketUrl,
         BLOCKSTACK_GAIA_HUB_LABEL } from './hub'

import { encryptECIES, decryptECIES } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate } from '../keys'
import { lookupProfile } from '../profiles'

import { Logger } from '../logger'

/**
 * Fetch the public read URL of a user file for the specified app.
 * @param {String} path - the path to the file to read
 * @param {String} username - The Blockstack ID of the user to look up
 * @param {String} appOrigin - The app origin
 * @param {String} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @return {Promise} that resolves to the public read URL of the file
 * or rejects with an error
 */
export function getUserAppFileUrl(path: string, username: string, appOrigin: string,
  zoneFileLookupURL: ?string = null) {
  return lookupProfile(username, zoneFileLookupURL)
    .then(profile => {
      if (profile.hasOwnProperty('apps')) {
        if (profile.apps.hasOwnProperty(appOrigin)) {
          return profile.apps[appOrigin]
        } else {
          return null
        }
      } else {
        return null
      }
    })
    .then((bucketUrl) => {
      if (bucketUrl) {
        const bucket = bucketUrl.replace(/\/?(\?|#|$)/, '/$1')
        return `${bucket}${path}`
      } else {
        return null
      }
    })
}

/**
 * Encrypts the data provided with the transit public key.
 * @param {String|Buffer} content - data to encrypt
 * @param {Object} [options=null] - options object
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key to use for decryption. If not provided, will use user's appPrivateKey.
 * @return {String} Stringified ciphertext object
 */
export function encryptContent(content: string | Buffer, options?: {privateKey?: string}) {
  const defaults = { privateKey: null }
  const opt = Object.assign({}, defaults, options)
  if (! opt.privateKey) {
    opt.privateKey = loadUserData().appPrivateKey
  }

  const publicKey = getPublicKeyFromPrivate(opt.privateKey)
  const cipherObject = encryptECIES(publicKey, content)
  return JSON.stringify(cipherObject)
}

/**
 * Decrypts data encrypted with `encryptContent` with the
 * transit private key.
 * @param {String|Buffer} content - encrypted content.
 * @param {Object} [options=null] - options object
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key to use for decryption. If not provided, will use user's appPrivateKey.
 * @return {String|Buffer} decrypted content.
 */
export function decryptContent(content: string, options?: {privateKey?: ?string}) {
  const defaults = { privateKey: null }
  const opt = Object.assign({}, defaults, options)
  if (! opt.privateKey) {
    opt.privateKey = loadUserData().appPrivateKey
  }

  const cipherObject = JSON.parse(content)
  return decryptECIES(opt.privateKey, cipherObject)
}

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.decrypt=true] - try to decrypt the data with the app private key
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 * @param {String} [options.zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(path: string, options?: {decrypt?: boolean, username?: string, app?: string,
  zoneFileLookupURL?: ?string}) {
  const defaults = {
    decrypt: true,
    username: null,
    app: window.location.origin,
    zoneFileLookupURL: null
  }

  const opt = Object.assign({}, defaults, options)

  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => {
      if (opt.username) {
        return getUserAppFileUrl(path, opt.username, opt.app, opt.zoneFileLookupURL)
      } else {
        return getFullReadUrl(path, gaiaHubConfig)
      }
    })
    .then((readUrl) => {
      if (!readUrl) {
        return null
      } else {
        fetch(readUrl)
      }
    })
    .then((response) => {
      if(response == null){
        console.log(`User does not have apps key, returning null`)
        return null
      }
      if (response.status !== 200) {
        if (response.status === 404) {
          Logger.debug(`getFile ${path} returned 404, returning null`)
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
        return decryptContent(storedContents)
      } else {
        return storedContents
      }
    })
}

/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.encrypt=true] - encrypt the data with the app private key
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, options?: {encrypt?: boolean}) {
  const defaults = {
    encrypt: true
  }

  const opt = Object.assign({}, defaults, options)

  let contentType = 'text/plain'
  if (typeof(content) !== 'string') {
    contentType = 'application/octet-stream'
  }
  if (opt.encrypt) {
    content = encryptContent(content)
    contentType = 'application/json'
  }
  return getOrSetLocalGaiaHubConnection()
    .then((gaiaHubConfig) => uploadToGaiaHub(path, content, gaiaHubConfig, contentType))
}

/**
 * Get the app storage bucket URL
 * @param {String} gaiaHubUrl - the gaia hub URL
 * @param {String} appPrivateKey - the app private key used to generate the app address
 * @returns {Promise} That resolves to the URL of the app index file
 * or rejects if it fails
 */
export function getAppBucketUrl(gaiaHubUrl: string, appPrivateKey: string) {
  return getBucketUrl(gaiaHubUrl, appPrivateKey)
}

/**
 * Deletes the specified file from the app's data store. Currently not implemented.
 * @param {String} path - the path to the file to delete
 * @returns {Promise} that resolves when the file has been removed
 * or rejects with an error
 * @private
 */
export function deleteFile(path: string) {
  Promise.reject(new Error(`Delete of ${path} not supported by gaia hubs`))
}

export { connectToGaiaHub, uploadToGaiaHub, BLOCKSTACK_GAIA_HUB_LABEL, GaiaHubConfig }
