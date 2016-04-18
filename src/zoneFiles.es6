import { makeZoneFile } from 'blockstack-zones'

export function prepareZoneFileForHostedFile(origin, tokenFileUrl) {
  if (tokenFileUrl.indexOf('://') < 0) {
    throw new Error('Invalid token file url')
  }

  let urlParts = tokenFileUrl.split('://')[1].split('/'),
      domain = urlParts[0],
      pathname = '/' + urlParts.slice(1).join('/')

  let zoneFile = {
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

  let zoneFileTemplate = '{$origin}\n\
{$ttl}\n\
{uri}\n\
'

  return makeZoneFile(zoneFile, zoneFileTemplate)
}