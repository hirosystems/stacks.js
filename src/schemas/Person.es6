import { getProfileFromTokens } from '../tokening'
import inspector from 'schema-inspector'

let schemaDefinition = {
  type: 'object',
  properties: {
    '@context': { type: 'string', optional: true },
    '@type': { type: 'string' },
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
        }
      }
    },
    knows: {
      type: 'array',
      optional: true,
      items: {
        type: 'object',
        properties: {
          '@type': { type: 'string' }
        }
      }
    },
    birthDate: { type: 'string', optional: true },
    taxID: { type: 'string', optional: true },
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
    }
  }
}

export class Person {
  constructor(profile = {}, context = 'http://schema.org/') {
    this._profile = Object.assign({}, {
      '@context': context,
      '@type': 'Person'
    }, profile)
  }

  profile() {
    return this._profile
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Person(profile)
  }

  static validate(profile) {
    return inspector.validate(schemaDefinition, profile)
  }
}