'use strict'

export {
  makeAuthRequest,
  makeAuthResponse,
  Authenticator
} from './auth'

export {
  makeDIDFromPublicKey,
  makeDIDFromAddress,
  getPublicKeyOrAddressFromDID
} from './decentralizedIDs'

export {
  getEntropy,
  makeECPrivateKey,
  ecPrivateKeyToPublicKey
} from './keyUtils'

export {
  Profile
} from './profile'

export {
  validateProofs
} from './profileProofs'

export {
  Person,
  Organization,
  CreativeWork,
  getPersonFromLegacyFormat,
  resolveZoneFileToPerson
} from './profileSchemas'

export {
  signProfileToken,
  wrapProfileToken,
  verifyProfileToken,
  getProfileFromToken
} from './profileTokens'

export {
  services,
  containsValidProofStatement
} from './services'

export {
  nextYear,
  nextMonth,
  nextHour,
  makeUUID4
} from './utils'

export {
  makeZoneFileForHostedProfile,
  getTokenFileUrlFromZoneFile
} from './zoneFiles'

