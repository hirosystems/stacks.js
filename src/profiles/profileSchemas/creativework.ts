// @ts-ignore: Could not find a declaration file for module
import inspector from 'schema-inspector'
import { extractProfile } from '../profileTokens'
import { Profile } from '../profile'

const schemaDefinition: {[key: string]: any} = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
    '@id': { type: 'string', optional: true }
  }
}

/**
 * @ignore
 */
export class CreativeWork extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'CreativeWork'
    }, this._profile)
  }

  /**
   * 
   * @ignore
   */
  static validateSchema(profile: any, strict = false) {
    schemaDefinition.strict = strict
    return inspector.validate(schemaDefinition, profile)
  }

  /**
   * @ignore
   */
  static fromToken(token: string, publicKeyOrAddress: string | null = null) {
    const profile = extractProfile(token, publicKeyOrAddress)
    return new CreativeWork(profile)
  }
}
