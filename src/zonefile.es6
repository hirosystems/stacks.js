import * as zonefileFormatter from 'dns-zonefile'

export class Zonefile {
  constructor(zonefile) {
    if (typeof zonefile === 'object') {
      this.jsonZonefile = JSON.parse(JSON.stringify(zonefile))
    } else if (typeof zonefile === 'string') {
      this.jsonZonefile = zonefileFormatter.parse(zonefile)
    }
  }

  toJSON() {
    return this.jsonZonefile
  }

  toString() {
    return zonefileFormatter.generate(this.toJSON())
  }

  static prepareForHostedFile(origin, tokenFileUrl) {
    if (tokenFileUrl.indexOf('://') < 0) {
      throw new Error('Invalid token file url')
    }

    let urlParts = tokenFileUrl.split('://')[1].split('/'),
        domain = urlParts[0],
        pathname = '/' + urlParts.slice(1).join('/')

    let zonefile = {
      "$origin": origin,
      "$ttl": "3600",
      "cname": [
        { "name": "@", "alias": domain }
      ],
      "txt": [
        { "name": "@", "txt": `pathname: ${pathname}` }
      ]
    }
    console.log(zonefile)
    return new Zonefile(zonefile)
  }
}