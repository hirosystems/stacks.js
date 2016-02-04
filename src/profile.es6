import { getProfileFromTokens, signProfileTokens } from './tokening'
import inspector from 'schema-inspector'

let schemaDefinition = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' }
  }
}

export class Profile {
  constructor(profile = {}) {
    this._profile = Object.assign({}, {
      '@context': 'http://schema.org/'
    }, profile)
  }

  toJSON() {
    return this._profile
  }

  toSignedTokens(privateKeychain) {
    return signProfileTokens([this.toJSON()], privateKeychain)
  }

  static validate(profile) {
    return inspector.validate(schemaDefinition, profile)
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Profile(profile)
  }
}