/* @flow */
import bitcoin from 'bitcoinjs-lib'
import crypto from 'crypto'

import { TokenSigner } from 'jsontokens'
import { ecPairToAddress } from '../utils'
import { getPublicKeyFromPrivate, hexStringToECPair } from '../index'
import { BLOCKSTACK_DEFAULT_GAIA_HUB_URL } from '../auth/authConstants'

import type { UserSession } from '../auth/userSession'
import { Logger } from '../logger'
import { InvalidStateError } from '../errors'

export const BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config'

export type GaiaHubConfig = {
  address: string,
  url_prefix: string,
  token: string,
  server: string
}

export function uploadToGaiaHub(filename: string, contents: any,
                                hubConfig: GaiaHubConfig,
                                contentType: string = 'application/octet-stream'): Promise<*> {
  Logger.debug(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`)
  return fetch(`${hubConfig.server}/store/${hubConfig.address}/${filename}`,
               {
                 method: 'POST',
                 headers: {
                   'Content-Type': contentType,
                   Authorization: `bearer ${hubConfig.token}`
                 },
                 body: contents
               })
    .then(response => response.text())
    .then(responseText => JSON.parse(responseText))
    .then(responseJSON => responseJSON.publicURL)
}

export function getFullReadUrl(filename: string,
                               hubConfig: GaiaHubConfig): string {
  return `${hubConfig.url_prefix}${hubConfig.address}/${filename}`
}

function makeLegacyAuthToken(challengeText: string, signerKeyHex: string): string {
  // only sign specific legacy auth challenges.
  let parsedChallenge
  try {
    parsedChallenge = JSON.parse(challengeText)
  } catch (err) {
    throw new Error('Failed in parsing legacy challenge text from the gaia hub.')
  }
  if (parsedChallenge[0] === 'gaiahub'
      && parsedChallenge[3] === 'blockstack_storage_please_sign') {
    const signer = hexStringToECPair(signerKeyHex
                                     + (signerKeyHex.length === 64 ? '01' : ''))
    const digest = bitcoin.crypto.sha256(challengeText)
    const signature = signer.sign(digest).toDER().toString('hex')
    const publickey = getPublicKeyFromPrivate(signerKeyHex)
    const token = Buffer.from(JSON.stringify(
      { publickey, signature }
    )).toString('base64')
    return token
  } else {
    throw new Error('Failed to connect to legacy gaia hub. If you operate this hub, please update.')
  }
}

function makeV1GaiaAuthToken(hubInfo: Object,
                             signerKeyHex: string,
                             hubUrl: string,
                             associationToken?: string): string {
  const challengeText = hubInfo.challenge_text
  const handlesV1Auth = (hubInfo.latest_auth_version
                         && parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1)
  const iss = getPublicKeyFromPrivate(signerKeyHex)

  if (!handlesV1Auth) {
    return makeLegacyAuthToken(challengeText, signerKeyHex)
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const payload = {
    gaiaChallenge: challengeText,
    hubUrl,
    iss,
    salt,
    associationToken
  }
  const token = new TokenSigner('ES256K', signerKeyHex).sign(payload)
  return `v1:${token}`
}

export function connectToGaiaHub(caller: UserSession,
                                 gaiaHubUrl: string,
                                 challengeSignerHex: string,
                                 associationToken?: string): Promise<GaiaHubConfig> {
  if (!associationToken) {
    // maybe given in local storage?
    try {
      const userData = caller.loadUserData()
      if (userData && userData.gaiaAssociationToken) {
        associationToken = userData.gaiaAssociationToken
      }
    } catch (e) {
      associationToken = undefined
    }
  }

  Logger.debug(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)

  return fetch(`${gaiaHubUrl}/hub_info`)
    .then(response => response.json())
    .then((hubInfo) => {
      const readURL = hubInfo.read_url_prefix
      const token = makeV1GaiaAuthToken(hubInfo, challengeSignerHex, gaiaHubUrl, associationToken)
      const address = ecPairToAddress(hexStringToECPair(challengeSignerHex
                                        + (challengeSignerHex.length === 64 ? '01' : '')))
      return {
        url_prefix: readURL,
        address,
        token,
        server: gaiaHubUrl
      }
    })
}

/**
 * These two functions are app-specific connections to gaia hub,
 *   they read the user data object for information on setting up
 *   a hub connection, and store the hub config to localstorage
 * @param {UserSession} caller - the instance calling this function
 * @private
 * @returns {Promise} that resolves to the new gaia hub connection
 */
export function setLocalGaiaHubConnection(caller: UserSession): Promise<GaiaHubConfig> {
  const userData = caller.loadUserData()

  if (!userData) {
    throw new InvalidStateError('Missing userData')
  }

  if (!userData.hubUrl) {
    userData.hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL
  }

  return connectToGaiaHub(caller,
                          userData.hubUrl,
                          userData.appPrivateKey,
                          userData.associationToken)
    .then((gaiaConfig) => {
      userData.gaiaHubConfig = gaiaConfig
      return gaiaConfig
    })
}

export function getOrSetLocalGaiaHubConnection(caller: UserSession): Promise<GaiaHubConfig> {
  const userData = caller.store.getSessionData().userData
  if (!userData) {
    throw new InvalidStateError('Missing userData')
  }
  const hubConfig = userData.gaiaHubConfig
  if (hubConfig) {
    return Promise.resolve(hubConfig)
  }
  return setLocalGaiaHubConnection(caller)
}

export function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string> {
  let challengeSigner
  try {
    challengeSigner = bitcoin.ECPair.fromPrivateKey(new Buffer(appPrivateKey, 'hex'))
  } catch (e) {
    return Promise.reject(e)
  }

  return fetch(`${gaiaHubUrl}/hub_info`)
    .then(response => response.text())
    .then(responseText => JSON.parse(responseText))
    .then((responseJSON) => {
      const readURL = responseJSON.read_url_prefix
      const address = ecPairToAddress(challengeSigner)
      const bucketUrl = `${readURL}${address}/`
      return bucketUrl
    })
}
