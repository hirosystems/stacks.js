'use strict'

import { signProfileToken, getProfileFromToken } from '../profileTokens'
import inspector from 'schema-inspector'
import { Profile } from '../profile'

const schemaDefinition = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
    '@id': { type: 'string', optional: true }
  }
}

export class CreativeWork extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'CreativeWork'
    }, this._profile)
  }

  static validateSchema(profile, strict=false) {
    schemaDefinition['strict'] = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromToken(token, publicKeyOrAddress=null) {
    const profile = getProfileFromToken(token, publicKeyOrAddress)
    return new CreativeWork(profile)
  }
}