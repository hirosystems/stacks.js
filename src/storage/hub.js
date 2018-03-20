import bitcoin from 'bitcoinjs-lib'
import bigi from 'bigi'

import { loadUserData } from '../auth/authApp'
import { BLOCKSTACK_DEFAULT_GAIA_HUB_URL, BLOCKSTACK_STORAGE_LABEL } from '../auth/authConstants'

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
  console.log(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`)
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

export function connectToGaiaHub(gaiaHubUrl: string, challengeSignerHex: string): Promise<*> {
  console.log(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)
  const challengeSigner = new bitcoin.ECPair(bigi.fromHex(challengeSignerHex))

  return fetch(`${gaiaHubUrl}/hub_info`)
    .then((response) => response.text())
    .then((responseText) => JSON.parse(responseText))
    .then((responseJSON) => {
      const readURL = responseJSON.read_url_prefix
      const challenge = responseJSON.challenge_text
      const digest = bitcoin.crypto.sha256(challenge)
      const signature = challengeSigner.sign(digest)
            .toDER().toString('hex')
      const publickey = challengeSigner.getPublicKeyBuffer()
            .toString('hex')
      const token = new Buffer(JSON.stringify(
        { publickey, signature })).toString('base64')
      const address = challengeSigner.getAddress()
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
  console.log(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)
  const challengeSigner = new bitcoin.ECPair(bigi.fromHex(appPrivateKey))

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
