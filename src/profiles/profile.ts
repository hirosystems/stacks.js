// @ts-ignore: Could not find a declaration file for module
import * as inspector from 'schema-inspector'

import { signProfileToken, extractProfile } from './profileTokens'
import { validateProofs } from './profileProofs'
import { makeProfileZoneFile } from './profileZoneFiles'

const schemaDefinition: {[key: string]: any} = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' }
  }
}
 
/**
 * Represents a user profile
 * 
 */
export class Profile {
  _profile: {[key: string]: any}

  constructor(profile = {}) {
    this._profile = Object.assign({}, {
      '@context': 'http://schema.org/'
    }, profile)
  }

  toJSON() {
    return Object.assign({}, this._profile)
  }

  toToken(privateKey: string) {
    return signProfileToken(this.toJSON(), privateKey)
  }

  static validateSchema(profile: any, strict = false) {
    schemaDefinition.strict = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromToken(token: string, publicKeyOrAddress: string | null = null) {
    const profile = extractProfile(token, publicKeyOrAddress)
    return new Profile(profile)
  }

  static makeZoneFile(domainName: string, tokenFileURL: string) {
    return makeProfileZoneFile(domainName, tokenFileURL)
  }

  static validateProofs(domainName: string) {
    return validateProofs(new Profile().toJSON(), domainName)
  }
}
