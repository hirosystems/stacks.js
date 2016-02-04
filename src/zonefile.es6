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
}