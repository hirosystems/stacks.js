
export * from './auth'
export * from './profiles'
export * from './storage'

export {
  makeDIDFromAddress, makeDIDFromPublicKey, getDIDType, getAddressFromDID
} from './dids'
export {
  getEntropy, makeECPrivateKey, publicKeyToAddress, getPublicKeyFromPrivate
} from './keys'
export {
  nextYear, nextMonth, nextHour, makeUUID4, hasprop, updateQueryStringParameter,
  isLaterVersion
} from './utils'

export * from './operations'

export { decodeToken } from 'jsontokens'
