import { makeZoneFile } from 'zone-file'

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
