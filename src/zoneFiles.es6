import zoneFileFormatter from 'zone-file'

export class ZoneFile {
  constructor(zoneFile) {
    if (typeof zoneFile === 'object') {
      this.jsonZoneFile = JSON.parse(JSON.stringify(zoneFile))
    } else if (typeof zoneFile === 'string') {
      this.jsonZoneFile = zoneFileFormatter.parse(zoneFile)
    }
  }

  toJSON() {
    return this.jsonZoneFile
  }

  toString() {
    return zoneFileFormatter.generate(this.toJSON())
  }

  static prepareForHostedFile(origin, tokenFileUrl) {
    if (tokenFileUrl.indexOf('://') < 0) {
      throw new Error('Invalid token file url')
    }

    let urlParts = tokenFileUrl.split('://')[1].split('/'),
        domain = urlParts[0],
        pathname = '/' + urlParts.slice(1).join('/')

    let zoneFile = {
      "$origin": origin,
      "$ttl": "3600",
      "cname": [
        { "name": "@", "alias": domain }
      ],
      "txt": [
        { "name": "@", "txt": `pathname: ${pathname}` }
      ]
    }
    return new ZoneFile(zoneFile)
  }
}