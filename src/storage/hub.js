import bitcoin from 'bitcoinjs-lib'
import bigi from 'bigi'
import crypto from 'crypto'

import { loadUserData } from '../auth/authApp'
import { TokenSigner } from 'jsontokens'
import { getPublicKeyFromPrivate, hexStringToECPair } from '../index'
import { BLOCKSTACK_DEFAULT_GAIA_HUB_URL, BLOCKSTACK_STORAGE_LABEL } from '../auth/authConstants'
import { Logger } from '../logger'

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
        { method: 'POST',
          headers: {
            'Content-Type': contentType,
            Authorization: `bearer ${hubConfig.token}`
          },
          body: contents })
    .then((response) => response.text())
    .then((responseText) => JSON.parse(responseText))
    .then((responseJSON) => responseJSON.publicURL)
}

export function getFullReadUrl(filename: string,
                               hubConfig: GaiaHubConfig): string {
  return `${hubConfig.url_prefix}${hubConfig.address}/${filename}`
}

function makeV1GaiaAuthToken(hubInfo: Object, signerKeyHex: string): string {
  const challengeText = hubInfo.challenge_text
  const handlesV1Auth = (hubInfo.latest_auth_version &&
                         parseInt(hubInfo.latest_auth_version.slice(1), 10) >= 1)
  if (!handlesV1Auth) {
    throw new Error('Connected gaia hub doesn\'t support V1 auth. Refusing downgrade')
  }

  const iss = getPublicKeyFromPrivate(signerKeyHex)
  const salt = crypto.randomBytes(16).toString('hex')
  const payload = { gaiaChallenge: challengeText,
                    iss, salt }
  const token = new TokenSigner('ES256K', signerKeyHex).sign(payload)
  return `v1:${token}`
}

export function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string): Promise<*> {
  Logger.debug(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)

  return fetch(`${gaiaHubUrl}/hub_info`)
    .then((response) => response.json())
    .then((hubInfo) => {
      const readURL = hubInfo.read_url_prefix
      const token = makeV1GaiaAuthToken(hubInfo, challengeSignerHex)
      const address = hexStringToECPair(challengeSignerHex +
                                        (challengeSignerHex.length === 64 ? '01' : ''))
            .getAddress()
      return { url_prefix: readURL,
               address,
               token,
               server: gaiaHubUrl }
    })
}

/**
 * These two functions are app-specific connections to gaia hub,
 *   they read the user data object for information on setting up
 *   a hub connection, and store the hub config to localstorage
 * @private
 * @returns {Promise} that resolves to the new gaia hub connection
 */
export function setLocalGaiaHubConnection(): Promise<*> {
  let userData = loadUserData()

  if (!userData.hubUrl) {
    userData.hubUrl = BLOCKSTACK_DEFAULT_GAIA_HUB_URL

    window.localStorage.setItem(
      BLOCKSTACK_STORAGE_LABEL, JSON.stringify(userData))

    userData = loadUserData()
  }

  return connectToGaiaHub(userData.hubUrl, userData.appPrivateKey)
    .then((gaiaConfig) => {
      localStorage.setItem(BLOCKSTACK_GAIA_HUB_LABEL, JSON.stringify(gaiaConfig))
      return gaiaConfig
    })
}

export function getOrSetLocalGaiaHubConnection(): Promise<*> {
  const hubConfig = JSON.parse(localStorage.getItem(BLOCKSTACK_GAIA_HUB_LABEL))
  if (hubConfig !== null) {
    return Promise.resolve(hubConfig)
  } else {
    return setLocalGaiaHubConnection()
  }
}

export function getBucketUrl(gaiaHubUrl, appPrivateKey): Promise<*> {
  let challengeSigner
  try {
    challengeSigner = new bitcoin.ECPair(bigi.fromHex(appPrivateKey))
  } catch (e) {
    return Promise.reject(e)
  }

  return fetch(`${gaiaHubUrl}/hub_info`)
    .then((response) => response.text())
    .then((responseText) => JSON.parse(responseText))
    .then((responseJSON) => {
      const readURL = responseJSON.read_url_prefix
      const address = challengeSigner.getAddress()
      const bucketUrl = `${readURL}${address}/`
      return bucketUrl
    })
}
