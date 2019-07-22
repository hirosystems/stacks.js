// @ts-ignore: Could not find a declaration file for module
import { makeZoneFile, parseZoneFile } from 'zone-file'
import { extractProfile } from './profileTokens'
import { Person } from './profileSchemas/person'
import { Logger } from '../logger'
import { fetchPrivate } from '../fetchUtil'

/**
 * 
 * @param origin 
 * @param tokenFileUrl 
 * 
 * @ignore
 */
export function makeProfileZoneFile(origin: string, tokenFileUrl: string) {
  if (tokenFileUrl.indexOf('://') < 0) {
    throw new Error('Invalid token file url')
  }

  const urlScheme = tokenFileUrl.split('://')[0]
  const urlParts = tokenFileUrl.split('://')[1].split('/')
  const domain = urlParts[0]
  const pathname = `/${urlParts.slice(1).join('/')}`

  const zoneFile = {
    $origin: origin,
    $ttl: 3600,
    uri: [
      {
        name: '_http._tcp',
        priority: 10,
        weight: 1,
        target: `${urlScheme}://${domain}${pathname}`
      }
    ]
  }

  const zoneFileTemplate = '{$origin}\n{$ttl}\n{uri}\n'


  return makeZoneFile(zoneFile, zoneFileTemplate)
}

/**
 * 
 * @param zoneFileJson 
 * 
 * @ignore
 */
export function getTokenFileUrl(zoneFileJson: any): string | null {
  if (!zoneFileJson.hasOwnProperty('uri')) {
    return null
  }
  if (!Array.isArray(zoneFileJson.uri)) {
    return null
  }
  if (zoneFileJson.uri.length < 1) {
    return null
  }
  const firstUriRecord = zoneFileJson.uri[0]

  if (!firstUriRecord.hasOwnProperty('target')) {
    return null
  }
  let tokenFileUrl = firstUriRecord.target

  if (tokenFileUrl.startsWith('https')) {
    // pass
  } else if (tokenFileUrl.startsWith('http')) {
    // pass
  } else {
    tokenFileUrl = `https://${tokenFileUrl}`
  }

  return tokenFileUrl
}

/**
 * 
 * @param zoneFile 
 * @param publicKeyOrAddress 
 * 
 * @ignore
 */
export function resolveZoneFileToProfile(zoneFile: any, publicKeyOrAddress: string) {
  return new Promise((resolve, reject) => {
    let zoneFileJson = null
    try {
      zoneFileJson = parseZoneFile(zoneFile)
      if (!zoneFileJson.hasOwnProperty('$origin')) {
        zoneFileJson = null
      }
    } catch (e) {
      reject(e)
    }

    let tokenFileUrl: string | null = null
    if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
      tokenFileUrl = getTokenFileUrl(zoneFileJson)
    } else {
      let profile = null
      try {
        profile = JSON.parse(zoneFile)
        profile = Person.fromLegacyFormat(profile).profile()
      } catch (error) {
        reject(error)
      }
      resolve(profile)
      return
    }

    if (tokenFileUrl) {
      fetchPrivate(tokenFileUrl)
        .then(response => response.text())
        .then(responseText => JSON.parse(responseText))
        .then((responseJson) => {
          const tokenRecords = responseJson
          const profile = extractProfile(tokenRecords[0].token, publicKeyOrAddress)
          resolve(profile)
        })
        .catch((error) => {
          Logger.error(`resolveZoneFileToProfile: error fetching token file ${tokenFileUrl}: ${error}`)
          reject(error)
        })
    } else {
      Logger.debug('Token file url not found. Resolving to blank profile.')
      resolve({})
    }
  })
}
