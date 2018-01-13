
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
  isLaterVersion, isSameOriginAbsoluteUrl
} from './utils'
export { decodeToken } from 'jsontokens'
