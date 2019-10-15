// @ts-ignore: Could not find a declaration file for module
import * as inspector from 'schema-inspector'

import { Profile } from '../profile'
import { extractProfile } from '../profileTokens'
import { getPersonFromLegacyFormat } from './personLegacy'
import {
  getName, getFamilyName, getGivenName, getAvatarUrl, getDescription,
  getVerifiedAccounts, getAddress, getBirthDate,
  getConnections, getOrganizations
} from './personUtils'

const schemaDefinition = {
  type: 'object',
  strict: false,
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
    '@id': { type: 'string', optional: true },
    name: { type: 'string', optional: true },
    givenName: { type: 'string', optional: true },
    familyName: { type: 'string', optional: true },
    description: { type: 'string', optional: true },
    image: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' },
          name: { type: 'string', optional: true },
          contentUrl: { type: 'string', optional: true }
        }
      }
    },
    website: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' },
          url: { type: 'string', optional: true }
        }
      }
    },
    account: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' },
          service: { type: 'string', optional: true },
          identifier: { type: 'string', optional: true },
          proofType: { type: 'string', optional: true },
          proofUrl: { type: 'string', optional: true },
          proofMessage: { type: 'string', optional: true },
          proofSignature: { type: 'string', optional: true }
        }
      }
    },
    worksFor: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' },
          '@id': { type: 'string', optional: true }
        }
      }
    },
    knows: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' },
          '@id': { type: 'string', optional: true }
        }
      }
    },
    address: {
      type: 'object',
      optional: true,
      properties: {
        '@type': { type: 'string' },
        streetAddress: { type: 'string', optional: true },
        addressLocality: { type: 'string', optional: true },
        postalCode: { type: 'string', optional: true },
        addressCountry: { type: 'string', optional: true }
      }
    },
    birthDate: { type: 'string', optional: true },
    taxID: { type: 'string', optional: true }
  }
}

/**
 * @ignore
 */
export class Person extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'Person'
    }, this._profile)
  }

  static validateSchema(profile: any, strict = false) {
    schemaDefinition.strict = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromToken(token: string, publicKeyOrAddress: string | null = null) {
    const profile = extractProfile(token, publicKeyOrAddress)
    return new Person(profile)
  }

  static fromLegacyFormat(legacyProfile: any) {
    const profile = getPersonFromLegacyFormat(legacyProfile)
    return new Person(profile)
  }

  toJSON() {
    return {
      profile: this.profile(),
      name: this.name(),
      givenName: this.givenName(),
      familyName: this.familyName(),
      description: this.description(),
      avatarUrl: this.avatarUrl(),
      verifiedAccounts: this.verifiedAccounts(),
      address: this.address(),
      birthDate: this.birthDate(),
      connections: this.connections(),
      organizations: this.organizations()
    }
  }

  profile() {
    return Object.assign({}, this._profile)
  }

  name() {
    return getName(this.profile())
  }

  givenName() {
    return getGivenName(this.profile())
  }

  familyName() {
    return getFamilyName(this.profile())
  }

  description() {
    return getDescription(this.profile())
  }

  avatarUrl() {
    return getAvatarUrl(this.profile())
  }

  verifiedAccounts(verifications?: any[]) {
    return getVerifiedAccounts(this.profile(), verifications)
  }

  address() {
    return getAddress(this.profile())
  }

  birthDate() {
    return getBirthDate(this.profile())
  }

  connections() {
    return getConnections(this.profile())
  }

  organizations() {
    return getOrganizations(this.profile())
  }
}
