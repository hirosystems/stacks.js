
import bitcoin from 'bitcoinjs-lib'
import crypto from 'crypto'

// @ts-ignore: Could not find a declaration file for module
import { TokenSigner } from 'jsontokens'
import { ecPairToAddress, hexStringToECPair } from '../utils'
import { getPublicKeyFromPrivate } from '../keys'
import { Logger } from '../logger'

export const BLOCKSTACK_GAIA_HUB_LABEL = 'blockstack-gaia-hub-config'

export type GaiaHubConfig = {
  address: string,
  url_prefix: string,
  token: string,
  server: string
}

export async function uploadToGaiaHub(
  filename: string, contents: any,
  hubConfig: GaiaHubConfig,
  contentType: string = 'application/octet-stream'
): Promise<string> {
  Logger.debug(`uploadToGaiaHub: uploading ${filename} to ${hubConfig.server}`)
  const response = await fetch(
    `${hubConfig.server}/store/${hubConfig.address}/${filename}`, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        Authorization: `bearer ${hubConfig.token}`
      },
      body: contents
    }
  )
  if (!response.ok) {
    throw new Error('Error when uploading to Gaia hub')
  } 
  const responseText = await response.text()
  const responseJSON = JSON.parse(responseText)
  return responseJSON.publicURL
}

export function getFullReadUrl(filename: string,
                               hubConfig: GaiaHubConfig): Promise<string> {
  return Promise.resolve(`${hubConfig.url_prefix}${hubConfig.address}/${filename}`)
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
    const digest = bitcoin.crypto.sha256(Buffer.from(challengeText))

    const signatureBuffer = signer.sign(digest)
    const signatureWithHash = bitcoin.script.signature.encode(
      signatureBuffer, bitcoin.Transaction.SIGHASH_NONE)
    
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

export async function connectToGaiaHub(
  gaiaHubUrl: string,
  challengeSignerHex: string,
  associationToken?: string
): Promise<GaiaHubConfig> {
  Logger.debug(`connectToGaiaHub: ${gaiaHubUrl}/hub_info`)

  const response = await fetch(`${gaiaHubUrl}/hub_info`)
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

export async function getBucketUrl(gaiaHubUrl: string, appPrivateKey: string): Promise<string> {
  const challengeSigner = bitcoin.ECPair.fromPrivateKey(Buffer.from(appPrivateKey, 'hex'))
  const response = await fetch(`${gaiaHubUrl}/hub_info`)
  const responseText = await response.text()
  const responseJSON = JSON.parse(responseText)
  const readURL = responseJSON.read_url_prefix
  const address = ecPairToAddress(challengeSigner)
  const bucketUrl = `${readURL}${address}/`
  return bucketUrl
}
