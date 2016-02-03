'use strict'

module.exports = {
  Person: require('./lib/schemas/Person').default,
  Organization: require('./lib/schemas/Organization').default,
  CreativeWork: require('./lib/schemas/CreativeWork').default,
  signProfileTokens: require('./lib/tokening').default.signProfileTokens,
  getProfileFromTokens: require('./lib/tokening').default.getProfileFromTokens,
  validateTokenRecord: require('./lib/tokening').default.validateTokenRecord,
  Zonefile: require('./lib/zonefile').default
}