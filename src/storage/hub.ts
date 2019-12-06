
import { Transaction, script, crypto as bjsCrypto, ECPair } from 'bitcoinjs-lib'
import * as crypto from 'crypto'

// @ts-ignore: Could not find a declaration file for module
import { TokenSigner } from 'jsontokens'
import {
  ecPairToAddress,
  hexStringToECPair,
  getBlockstackErrorFromResponse } from '../utils'
import { fetchPrivate } from '../fetchUtil'
import { getPublicKeyFromPrivate } from '../keys'
import { Logger } from '../logger'

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


function getUtf8StringByteLength(input: string) {
  return Buffer.byteLength(input, 'utf8')
}

function determineStringContentHeaders(
  contents: string, 
  contentType: string | undefined):
  { contentType?: string; contentLength?: number } {
  let contentLengthResult: number | undefined
  let contentTypeResult: string | undefined

  if (contentType === 'application/json') {
    // According to https://www.ietf.org/rfc/rfc4627.txt :
    // "JSON text SHALL be encoded in Unicode. The default encoding is UTF-8."
    // For more details see discussion at https://stackoverflow.com/q/9254891/794962
    contentLengthResult = getUtf8StringByteLength(contents)
  } else if (!contentType) {
    // If content is a string and contentType is not specified, then specify UTF8
    // otherwise string parsers (web servers and browsers) have undefined behavior.
    contentTypeResult = 'text/plain; charset=utf-8'
    contentLengthResult = getUtf8StringByteLength(contents)
  } else if (contentType.toLowerCase().trim().includes('charset=utf-8')) {
    // If contentType is some other format, but specified utf-8 charset,
    // then the content-length is known. 
    contentLengthResult = getUtf8StringByteLength(contents)
  } else if (contentType.toLowerCase().trim() === 'text/html') {
    // Another common contentType that is commonly not specified with the
    // recommended charset encoding, resulting in undefined behavior in different
    // browsers during unicode and localization related scenarios.
    // See https://www.w3.org/International/articles/http-charset/index
    contentTypeResult = 'text/html; charset=utf-8'
    contentLengthResult = getUtf8StringByteLength(contents)
  } else {
    // TODO: should probably console.warn here about likely incorrect usage
    // of string content type, and that content-length cannot be determined. 
  }
  return {
    contentLength: contentLengthResult,
    contentType: contentTypeResult
  }
}

function isPositiveFiniteNumber(num: number | undefined): num is number {
  return typeof num === 'number' 
    && isFinite(num) 
    && num > 0
}

// TODO: Avoid performing expensive operations like Blob/File memory buffering and encryption
//       by checking the expected payload size beforehand. 

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
  contentType?: string,
): Promise<string> {
  Logger.debug(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`)
  const postHeaders: Record<string, string> = {
    'Content-Type': contentType || 'application/octet-stream',
    Authorization: `bearer ${hubConfig.token}`
  }

  let contentLength: number | undefined
  if (typeof contents === 'string') {
    const stringContentInfo = determineStringContentHeaders(contents, contentType)
    contentLength = stringContentInfo.contentLength
    if (stringContentInfo.contentType) {
      postHeaders['Content-Type'] = stringContentInfo.contentType
    }
  } else if (ArrayBuffer.isView(contents)) {
    contentLength = contents.byteLength
  } else if (typeof Blob !== 'undefined' && contents instanceof Blob) {
    if (contents.size) { 
      contentLength = contents.size
    }
  }

  // check if hub has a specified max file upload size
  const maxSizeMegabytes = hubConfig.max_file_upload_size_megabytes
  if (isPositiveFiniteNumber(maxSizeMegabytes)) {
    // check if payload body content length is known
    if (isPositiveFiniteNumber(contentLength)) {
      const maxSizeBytes = Math.round(maxSizeMegabytes * 1024 * 1024)
      if (contentLength > maxSizeBytes) {
        // TODO: Use a specific error class type
        throw new Error(`The max file upload size for this hub is ${maxSizeBytes} bytes, the given content is ${contentLength} bytes`)
      }
    }
  }

  const response = await fetchPrivate(
    `${hubConfig.server}/store/${hubConfig.address}/${filename}`, {
      method: 'POST',
      headers: postHeaders,
      body: contents
    }
  )
  if (!response.ok) {
    throw await getBlockstackErrorFromResponse(response, 'Error when uploading to Gaia hub.')
  }
  const responseText = await response.text()
  const responseJSON = JSON.parse(responseText)
  return responseJSON.publicURL
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
    throw await getBlockstackErrorFromResponse(response, 'Error deleting file from Gaia hub.')
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
    const digest = bjsCrypto.sha256(Buffer.from(challengeText))

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
