import { makeZoneFile, parseZoneFile } from 'zone-file'
import { decodeToken } from 'jsontokens'
import { extractProfile } from './profileTokens'
import { Person } from './index'

export function makeProfileZoneFile(origin, tokenFileUrl) {
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

export function getTokenFileUrl(zoneFileJson) {
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

export function resolveZoneFileToProfilePublicKey(zoneFile, publicKeyOrAddress) {
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

    let tokenFileUrl = null
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
      resolve({ profile, publicKey: null })
      return
    }

    if (tokenFileUrl) {
      fetch(tokenFileUrl)
        .then((response) => response.text())
        .then((responseText) => JSON.parse(responseText))
        .then((responseJson) => {
          const tokenRecords = responseJson
          const profile = extractProfile(tokenRecords[0].token, publicKeyOrAddress)
          const decodedToken = decodeToken(tokenRecords[0].token)
          const publicKey = decodedToken.payload.issuer.publicKey
          resolve({ profile, publicKey })
          return
        })
        .catch((error) => {
          console.log(`resolveZoneFileToProfile: error fetching token file ${tokenFileUrl}`, error)
          reject(error)
        })
    } else {
      console.log('Token file url not found. Resolving to blank profile.')
      resolve({ profile: { }, publicKey: null })
      return
    }
  })
}

export function resolveZoneFileToProfile(zoneFile, publicKeyOrAddress) {
  return resolveZoneFileToProfilePublicKey(zoneFile, publicKeyOrAddress)
    .then(response => response.profile)
}
