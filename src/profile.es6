import { signTokenRecords } from './tokenSigning'
import { getProfileFromTokens } from './tokenVerifying'
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

  toSignedTokens(privateKeychain, standaloneProperties = []) {
    let profileComponents = [],
        profile = this.toJSON()
    standaloneProperties.map((property) => {
      if (profile.hasOwnProperty(property)) {
        let subprofile = {
          [property]: profile[property]
        }
        profileComponents.push(subprofile)
        delete profile[property]
      }
    })
    profileComponents = [
      profile,
      ...profileComponents
    ]
    return signTokenRecords(profileComponents, privateKeychain)
  }

  static validateSchema(profile) {
    return inspector.validate(schemaDefinition, profile)
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Profile(profile)
  }
}