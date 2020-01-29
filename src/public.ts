
import { protocolEchoReplyDetection } from './auth/protocolEchoDetection'

try {
  /**
   * Located here so it executes ASAP. The protocol handler detection is designed to work 
   * as a drop-in-replacement (non-breaking upgrade) for apps using blockstack.js. That 
   * requires doing this global and immediate detection. 
   * This function is also called in `isSignInPending` so that web app bundling the 
   * blockstack.js lib in a more modular way will still perform the protocol detection 
   * handling without any changes if this index file is not bundled in. 
   */
  protocolEchoReplyDetection()
} catch (error) {
  console.error(`Error performing global protocol echo reply detection: ${error}`)
}

export * from './auth'
export * from './profiles'

export {
  EncryptionOptions, EncryptContentOptions,
  PutFileOptions, getUserAppFileUrl, GetFileUrlOptions, GetFileOptions, getAppBucketUrl
} from './storage'

export {
  makeDIDFromAddress, makeDIDFromPublicKey, getDIDType, getAddressFromDID
} from './dids'

export {
  getEntropy, makeECPrivateKey, publicKeyToAddress, getPublicKeyFromPrivate,
  hexStringToECPair, ecPairToHexString, ecPairToAddress
} from './keys'

export {
  nextYear, nextMonth, nextHour, makeUUID4, updateQueryStringParameter,
  isLaterVersion, isSameOriginAbsoluteUrl
} from './utils'

export {
  transactions, safety, TransactionSigner,
  PubkeyHashSigner, addUTXOsToFund, estimateTXBytes
} from './operations'

export { BlockstackWallet, IdentityKeyPair } from './wallet'

export { network } from './network'

export { decodeToken } from 'jsontokens'

export { config } from './config'

export { encryptMnemonic, decryptMnemonic } from './encryption'

export { UserSession } from './auth/userSession'
