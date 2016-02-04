import { getProfileFromTokens } from '../tokening'

export class Person {
  constructor(profile = {}, context = 'http://schema.org/') {
    this._profile = Object.assign({}, {
      '@context': context,
      '@type': 'Person'
    }, profile)
  }

  static fromTokens(tokenRecords, publicKeychain) {
    let profile = getProfileFromTokens(tokenRecords, publicKeychain)
    return new Person(profile)
  }

  profile() {
    return this._profile
  }
}