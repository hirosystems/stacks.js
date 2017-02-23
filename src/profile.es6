'use strict'

import inspector from 'schema-inspector'

import {
  signProfileToken, verifyProfileToken, getProfileFromToken
} from './profileTokens'
import { validateProofs } from './profileProofs'
import { makeZoneFileForHostedProfile } from './utils'

const schemaDefinition = {
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
    return Object.assign({}, this._profile)
  }

  toToken(privateKey) {
    return signProfileToken(this.toJSON(), privateKey)
  }

  static validateSchema(profile, strict=false) {
    schemaDefinition['strict'] = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromToken(token, publicKeyOrAddress=null) {
    const profile = getProfileFromToken(token, publicKeyOrAddress)
    return new Profile(profile)
  }

  static makeZoneFile(domainName, tokenFileURL) {
    return makeZoneFileForHostedProfile(domainName, tokenFileURL)
  }

  static validateProofs(domainName) {
    return validateProofs(this.toJSON(), domainName)
  }
}