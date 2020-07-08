
import { Transaction, script, ECPair } from 'bitcoinjs-lib'
import { TokenSigner } from 'jsontokens'
import { getBlockstackErrorFromResponse } from '../utils'
import { fetchPrivate } from '../fetchUtil'
import { getPublicKeyFromPrivate, ecPairToAddress, hexStringToECPair, } from '../keys'
import { Logger } from '../logger'
import { randomBytes } from '../encryption/cryptoRandom'
import { hashSha256Sync } from '../encryption/sha2Hash'

/**
 * @ignore
 */
export const BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config'

/**
 * The configuration for the user's Gaia storage provider.
 */
export interface GaiaHubConfig {
  address: string,
  url_prefix: string,
  token: string,
  max_file_upload_size_megabytes: number | undefined,
  server: string
}

interface UploadResponse {
  publicURL: string,
  etag?: string
}

/**
 *
 * @param filename
 * @param contents
 * @param hubConfig
 * @param contentType
 *
 * @ignore
 */
export async function uploadToGaiaHub(
  filename: string,
  contents: Blob | Buffer | ArrayBufferView | string,
  hubConfig: GaiaHubConfig,
  contentType: string = 'application/octet-stream',
  newFile: boolean = true,
  etag?: string,
  dangerouslyIgnoreEtag?: boolean
): Promise<UploadResponse> {
  Logger.debug(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`)

  const headers: { [key: string]: string; } = {
    'Content-Type': contentType,
    Authorization: `bearer ${hubConfig.token}`
  }

  if (!dangerouslyIgnoreEtag) {
    if (newFile) {
      headers['If-None-Match'] = '*'
    } else if (etag) {
      headers['If-Match'] = etag
    }
  }

  const response = await fetchPrivate(
    `${hubConfig.server}/store/${hubConfig.address}/${filename}`, {
      method: 'POST',
      headers,
      body: contents
    }
  )
  if (!response.ok) {
    throw await getBlockstackErrorFromResponse(response, 'Error when uploading to Gaia hub.', hubConfig)
  }
  const responseText = await response.text()
  const responseJSON = JSON.parse(responseText)

  return responseJSON
}

export async function deleteFromGaiaHub(
  filename: string,
  hubConfig: GaiaHubConfig
): Promise<void> {
  Logger.debug(`deleteFromGaiaHub: deleting ${filename} from ${hubConfig.server}`)
  const response = await fetchPrivate(
    `${hubConfig.server}/delete/${hubConfig.address}/${filename}`, {
      method: 'DELETE',
      headers: {
        Authorization: `bearer ${hubConfig.token}`
      }
    }
  )
  if (!response.ok) {
    throw await getBlockstackErrorFromResponse(response, 'Error deleting file from Gaia hub.', hubConfig)
  }
}

/**
 *
 * @param filename
 * @param hubConfig
 *
 * @ignore
 */
export function getFullReadUrl(filename: string,
                               hubConfig: GaiaHubConfig): Promise<string> {
  return Promise.resolve(`${hubConfig.url_prefix}${hubConfig.address}/${filename}`)
}

/**
 *
 * @param challengeText
 * @param signerKeyHex
 *
 * @ignore
 */
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
    const digest = hashSha256Sync(Buffer.from(challengeText))

    const signatureBuffer = signer.sign(digest)
    const signatureWithHash = script.signature.encode(
      signatureBuffer, Transaction.SIGHASH_NONE)

    // We only want the DER encoding so remove the sighash version byte at the end.
    // See: https://github.com/bitcoinjs/bitcoinjs-lib/issues/1241#issuecomment-428062912
    const signature = signatureWithHash.toString('hex').slice(0, -2)

    const publickey = getPublicKeyFromPrivate(signerKeyHex)
    const token = Buffer.from(JSON.stringify(
      { publickey, signature }
    )).toString('base64')
    return token
  } else {
    throw new Error('Failed to connect to legacy gaia hub. If you operate this hub, please update.')
  }
}

/**
 *
 * @param hubInfo
 * @param signerKeyHex
 * @param hubUrl
 * @param associationToken
 *
 * @ignore
 */
function makeV1GaiaAuthToken(hubInfo: any,
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

  const salt = randomBytes(16).toString('hex')
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

/**
 *
 * @ignore
 */
export async function connectToGaiaHub(
  gaiaHubUrl: string,
  challengeSignerHex: string,
  associationToken?: string
): Promise<GaiaHubConfig> {
  Logger.debug(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)

  const response = await fetchPrivate(`${gaiaHubUrl}/hub_info`)
  const hubInfo = await response.json()
  const readURL = hubInfo.read_url_prefix
  const token = makeV1GaiaAuthToken(hubInfo, challengeSignerHex, gaiaHubUrl, associationToken)
  const address = ecPairToAddress(hexStringToECPair(challengeSignerHex
                                    + (challengeSignerHex.length === 64 ? '01' : '')))
  return {
    url_prefix: readURL,
    max_file_upload_size_megabytes: hubInfo.max_file_upload_size_megabytes,
    address,
    token,
    server: gaiaHubUrl
  }
}

/**
 *
 * @param gaiaHubUrl
 * @param appPrivateKey
 *
 * @ignore
 */
export async function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string> {
  const challengeSigner = ECPair.fromPrivateKey(Buffer.from(appPrivateKey, 'hex'))
  const response = await fetchPrivate(`${gaiaHubUrl}/hub_info`)
  const responseText = await response.text()
  const responseJSON = JSON.parse(responseText)
  const readURL = responseJSON.read_url_prefix
  const address = ecPairToAddress(challengeSigner)
  const bucketUrl = `${readURL}${address}/`
  return bucketUrl
}
