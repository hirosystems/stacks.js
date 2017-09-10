
export * from './auth'
export * from './profiles'
export * from './storage'
export * from './wallet'

export {
  makeDIDFromAddress, makeDIDFromPublicKey, getDIDType, getAddressFromDID
} from './dids'
export {
  getEntropy, makeECPrivateKey, publicKeyToAddress, decodePrivateKey,
  compressPublicKey, decompressPublicKey, getPubkeyHex
} from './keys'
export {
  nextYear, nextMonth, nextHour, makeUUID4, hasprop, updateQueryStringParameter
} from './utils'
export { decodeToken } from 'jsontokens'
