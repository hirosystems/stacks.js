/* @flow */

import { getOrSetLocalGaiaHubConnection, getFullReadUrl, GaiaHubConfig,
         connectToGaiaHub, uploadToGaiaHub, getBucketUrl,
         BLOCKSTACK_GAIA_HUB_LABEL } from './hub'

import { encryptECIES, decryptECIES, signECDSA, verifyECDSA } from '../encryption'
import { loadUserData } from '../auth'
import { getPublicKeyFromPrivate, publicKeyToAddress } from '../keys'
import { lookupProfile } from '../profiles'

import { SignatureVerificationError } from '../errors'
import { Logger } from '../logger'
// import fetch from 'isomorphic-fetch'

const SIGNATURE_FILE_SUFFIX = '.sig'

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
 * Encrypts the data provided with the app public key.
 * @param {String|Buffer} content - data to encrypt
 * @param {Object} [options=null] - options object
 * @param {String} options.publicKey - the hex string of the ECDSA private
 * key that will be used for decryption. If neither a public or private key
 * is provided, will use the user's app key pair
 * @param {String} options.privateKey - the hex string of the ECDSA private
 * key that will be used for decryption. The corresponding public key is computed
 * and used for encryption. If neither a publicKey nor private key is provided,
 * use the user's app key pair
 * @return {String} Stringified ciphertext object
 */
export function encryptContent(content: string | Buffer,
                               options?: {privateKey?: string, publicKey?: string}) {
  const defaults = { privateKey: null }
  const opt = Object.assign({}, defaults, options)
  let publicKey
  if (opt.publicKey) {
    publicKey = opt.publicKey
  } else if (opt.privateKey) {
    publicKey = getPublicKeyFromPrivate(opt.privateKey)
  } else {
    publicKey = getPublicKeyFromPrivate(loadUserData().appPrivateKey)
  }

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
  let privateKey = opt.privateKey
  if (!privateKey) {
    privateKey = loadUserData().appPrivateKey
  }

  const cipherObject = JSON.parse(content)

  return decryptECIES(privateKey, cipherObject)
}

function getGaiaAddress(app: string, username: ?string, zoneFileLookupURL: ?string) {
  return Promise.resolve()
    .then(() => {
      if (username) {
        return getUserAppFileUrl('/', username, app, zoneFileLookupURL)
      } else {
        return getOrSetLocalGaiaHubConnection()
          .then(gaiaHubConfig => getFullReadUrl('/', gaiaHubConfig))
      }
    })
    .then(fileUrl => {
      const matches = fileUrl.match(/([13][a-km-zA-HJ-NP-Z0-9]{26,33})/)
      return matches[matches.length - 1]
    })
}

function innerGetFile(path: string, app: string, username: ?string, zoneFileLookupURL: ?string,
                      forceText: boolean) : Promise<?string | ?ArrayBuffer> {
  return Promise.resolve()
    .then(() => {
      if (username) {
        return getUserAppFileUrl(path, username, app, zoneFileLookupURL)
      } else {
        return getOrSetLocalGaiaHubConnection()
          .then(gaiaHubConfig => getFullReadUrl(path, gaiaHubConfig))
      }
    })
    .then((readUrl) => new Promise((resolve, reject) => {
      if (!readUrl) {
        reject(null)
      } else {
        resolve(readUrl)
      }
    }))
    .then((readUrl) => fetch(readUrl))
    .then((response) => {
      if (response.status !== 200) {
        if (response.status === 404) {
          Logger.debug(`getFile ${path} returned 404, returning null`)
          return null
        } else {
          throw new Error(`getFile ${path} failed with HTTP status ${response.status}`)
        }
      }
      const contentType = response.headers.get('Content-Type')
      if (forceText || contentType === null ||
          contentType.startsWith('text') ||
          contentType === 'application/json') {
        return response.text()
      } else {
        return response.arrayBuffer()
      }
    })
}

/**
 * Retrieves the specified file from the app's data store.
 * @param {String} path - the path to the file to read
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.decrypt=true] - try to decrypt the data with the app private key
 * @param {String} options.username - the Blockstack ID to lookup for multi-player storage
 * @param {Boolean} options.verify - Whether the content should be verified, only to be used
 * when `putFile` was set to `sign = true`
 * @param {String} options.app - the app to lookup for multi-player storage -
 * defaults to current origin
 * @param {String} [options.zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, this will use the
 * blockstack.js's getNameInfo function instead.
 * @returns {Promise} that resolves to the raw data in the file
 * or rejects with an error
 */
export function getFile(path: string, options?: {
    decrypt?: boolean,
    verify?: boolean,
    username?: string,
    app?: string,
    zoneFileLookupURL?: ?string
  }) {
  const defaults = {
    decrypt: true,
    verify: false,
    username: null,
    app: window.location.origin,
    zoneFileLookupURL: null
  }

  const opt = Object.assign({}, defaults, options)

  // in the case of signature verification, but no
  //  encryption expected, need to fetch _two_ files.
  if (opt.verify && !opt.decrypt) {
    // future optimization note:
    //    in the case of _multi-player_ reads, this does a lot of excess
    //    profile lookups to figure out where to read files
    //    do browsers cache all these requests if Content-Cache is set?
    return Promise.all(
      [innerGetFile(path, opt.app, opt.username, opt.zoneFileLookupURL, false),
       innerGetFile(`${path}${SIGNATURE_FILE_SUFFIX}`, opt.app, opt.username,
                    opt.zoneFileLookupURL, true),
       getGaiaAddress(opt.app, opt.username, opt.zoneFileLookupURL)])
      .then(([fileContents, signatureContents, gaiaAddress]) => {
        if (!fileContents) {
          return fileContents
        }
        if (!gaiaAddress) {
          throw new SignatureVerificationError('Failed to get gaia address for verification')
        }
        if (!signatureContents || typeof signatureContents !== 'string') {
          throw new SignatureVerificationError('Failed to obtain signature for file')
        }
        const { signature, publicKey } = JSON.parse(signatureContents)
        const signerAddress = publicKeyToAddress(publicKey)
        if (gaiaAddress !== signerAddress) {
          throw new SignatureVerificationError(`Signer pubkey address (${signerAddress}) doesn't` +
                                               ` match gaia address (${gaiaAddress})`)
        } else if (! verifyECDSA(Buffer.from(fileContents), publicKey, signature)) {
          throw new SignatureVerificationError('Contents do not match ECDSA signature')
        } else {
          return fileContents
        }
      })
  }

  return innerGetFile(path, opt.app, opt.username, opt.zoneFileLookupURL, !!opt.decrypt)
    .then((storedContents) => {
      if (storedContents === null) {
        return storedContents
      } else if (opt.decrypt && !opt.verify) {
        if (typeof storedContents !== 'string') {
          throw new Error('Expected to get back a string for the cipherText')
        }
        return decryptContent(storedContents)
      } else if (opt.decrypt && opt.verify) {
        if (typeof storedContents !== 'string') {
          throw new Error('Expected to get back a string for the cipherText')
        }
        const { cipherText, signature, publicKey } = JSON.parse(storedContents)
        const appPrivateKey = loadUserData().appPrivateKey
        const appPublicKey = getPublicKeyFromPrivate(appPrivateKey)
        if (appPublicKey !== publicKey) {
          throw new SignatureVerificationError(
            'In Sign+Encrypt mode, signer pubkey should match decryption keypair')
        } else if (! verifyECDSA(cipherText, appPublicKey, signature)) {
          throw new SignatureVerificationError('Contents do not match ECDSA signature')
        } else {
          return decryptContent(cipherText)
        }
      } else if (!opt.verify && !opt.decrypt) {
        return storedContents
      } else {
        throw new Error('Should be unreachable.')
      }
    })
}

/**
 * Stores the data provided in the app's data store to to the file specified.
 * @param {String} path - the path to store the data in
 * @param {String|Buffer} content - the data to store in the file
 * @param {Object} [options=null] - options object
 * @param {Boolean} [options.encrypt=true] - encrypt the data with the app private key
 * @param {Boolean} [options.sign=false] - sign the data using ECDSA
 * @return {Promise} that resolves if the operation succeed and rejects
 * if it failed
 */
export function putFile(path: string, content: string | Buffer, options?: {
  encrypt?: boolean,
  sign?: boolean
  }) {
  const defaults = {
    encrypt: true,
    sign: false
  }

  const opt = Object.assign({}, defaults, options)

  let contentType = 'text/plain'
  if (typeof(content) !== 'string') {
    contentType = 'application/octet-stream'
  }

  // In the case of signing, but *not* encrypting,
  //   we perform two uploads. So the control-flow
  //   here will return there.
  if (!opt.encrypt && opt.sign) {
    const privateKey = loadUserData().appPrivateKey
    const signatureObject = signECDSA(privateKey, content)
    const signatureContent = JSON.stringify(signatureObject)
    return getOrSetLocalGaiaHubConnection()
      .then((gaiaHubConfig) =>
            Promise.all([
              uploadToGaiaHub(path, content, gaiaHubConfig, contentType),
              uploadToGaiaHub(`${path}${SIGNATURE_FILE_SUFFIX}`,
                              signatureContent, gaiaHubConfig, 'application/json')]))
      .then(fileUrls => fileUrls[0])
  }

  // In all other cases, we only need one upload.
  if (opt.encrypt && !opt.sign) {
    content = encryptContent(content)
    contentType = 'application/json'
  } else if (opt.encrypt && opt.sign) {
    const privateKey = loadUserData().appPrivateKey
    const cipherText = encryptContent(content, { privateKey })
    const { signature, publicKey } = signECDSA(privateKey, cipherText)
    const signedCipherObject = { signature, publicKey, cipherText }
    content = JSON.stringify(signedCipherObject)
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
