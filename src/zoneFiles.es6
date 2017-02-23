'use strict'

import { makeZoneFile, parseZoneFile } from 'zone-file'
import { getProfileFromToken } from './profileTokens'

export function makeZoneFileForHostedProfile(origin, tokenFileUrl) {
  if (tokenFileUrl.indexOf('://') < 0) {
    throw new Error('Invalid token file url')
  }

  const urlParts = tokenFileUrl.split('://')[1].split('/')
  const domain = urlParts[0]
  const pathname = '/' + urlParts.slice(1).join('/')

  const zoneFile = {
    "$origin": origin,
    "$ttl": 3600,
    "uri": [
      {
        "name": "_http._tcp",
        "priority": 10,
        "weight": 1,
        "target": `${domain}${pathname}`
      }
    ]
  }

  const zoneFileTemplate = '{$origin}\n\
{$ttl}\n\
{uri}\n\
'

  return makeZoneFile(zoneFile, zoneFileTemplate)
}

export function getTokenFileUrlFromZoneFile(zoneFileJson) {
  if (!zoneFileJson.hasOwnProperty('uri')) {
    return null
  }
  if (!Array.isArray(zoneFileJson.uri)) {
    return null
  }
  if (zoneFileJson.uri.length < 1) {
    return null
  }
  let firstUriRecord = zoneFileJson.uri[0]

  if (!firstUriRecord.hasOwnProperty('target')) {
    return null
  }
  let tokenFileUrl = firstUriRecord.target

  if (tokenFileUrl.startsWith('https')) {
    // pass
  } else if (tokenFileUrl.startsWith('http')) {
    // pass
  } else {
    tokenFileUrl = 'https://' + tokenFileUrl
  }

  return tokenFileUrl
}
