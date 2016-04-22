import { getProfileFromTokens } from '../tokenVerifying'
import inspector from 'schema-inspector'
import { Profile } from '../profile'
import { getPersonFromLegacyFormat } from './personLegacy'
import {
  getName, getFamilyName, getGivenName, getAvatarUrl, getDescription,
  getVerifiedAccounts, getAddress, getBirthDate,
  getConnections, getOrganizations
} from './personUtils'

let schemaDefinition = {
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
          'name': { type: 'string', optional: true },
          'contentUrl': { type: 'string', optional: true }
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
          'url': { type: 'string', optional: true }
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
          'service': { type: 'string', optional: true },
          'identifier': { type: 'string', optional: true },
          'proofType': { type: 'string', optional: true },
          'proofUrl': { type: 'string', optional: true },
          'proofMessage': { type: 'string', optional: true },
          'proofSignature': { type: 'string', optional: true }
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
        'streetAddress': { type: 'string', optional: true },
        'addressLocality': { type: 'string', optional: true },
        'postalCode': { type: 'string', optional: true },
        'addressCountry': { type: 'string', optional: true }
      }
    },
    birthDate: { type: 'string', optional: true },
    taxID: { type: 'string', optional: true }
  }
}

export class Person extends Profile {
  constructor(profile = {}) {
    super(profile)
    this._profile = Object.assign({}, {
      '@type': 'Person'
    }, this._profile)
  }

  static validateSchema(profile, strict = false) {
    schemaDefinition['strict'] = strict
    return inspector.validate(schemaDefinition, profile)
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Person(profile)
  }

  static fromLegacyFormat(legacyProfile) {
    let profile = getPersonFromLegacyFormat(legacyProfile)
    return new Person(profile)
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

  verifiedAccounts(verifications) {
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
