// TODO: replace with 'ajv' - its already a dependency and it is maintained
import inspector from 'schema-inspector'

import { extractProfile } from '../profileTokens'
import { Profile } from '../profile'

const schemaDefinition: {[key: string]: any} = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
    '@id': { type: 'string', optional: true }
  },
}

export class Organization extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'Organization'
    }, this._profile)
  }

  static validateSchema(profile, strict = false) {
    schemaDefinition.strict = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromToken(token, publicKeyOrAddress = null) {
    const profile = extractProfile(token, publicKeyOrAddress)
    return new Organization(profile)
  }
}
