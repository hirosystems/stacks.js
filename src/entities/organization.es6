import { getProfileFromTokens } from '../tokenVerifying'
import inspector from 'schema-inspector'
import { Profile } from '../profile'

let schemaDefinition = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
    '@id': { type: 'string', optional: true }
  }
}

export class Organization extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'Organization'
    }, this._profile)
  }

  static validate(profile) {
    return inspector.validate(schemaDefinition, profile)
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Organization(profile)
  }
}