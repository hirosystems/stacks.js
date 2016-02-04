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
    let zonefile = {
      '$origin': origin,
      "$ttl": "3600",
      txt: [
        { name: '@', txt: tokenFileUrl }
      ]
    }
    return new Zonefile(zonefile)
  }
}