

import queryString from 'query-string'

// TODO: Putting in here so it executes ASAP. There is probably a better place to put this.
// Note: This prototype is designed to work as a drop-in-replacement (non-breaking upgrade)
// for apps using blockstack.js. That requires doing this hacky global & immediate detection. 
// A more proper approach would require developers to call an additional blockstack.js method 
// for invoking this detection method.
(function protocolEchoReplyDetection() {
  // Check that the `window` APIs exist
  if (typeof window !== 'object' || !window.location || !window.localStorage) {
    // Exit detection function - we are not running in a browser environment.
    return
  }
  // Check if the location query string contains a protocol-echo reply.
  // If so, this page was only re-opened to signal back the originating 
  // tab that the protocol handler is installed. 
  const queryDict = queryString.parse(window.location.search)
  if (queryDict.echoReply) {
    // Use localStorage to notify originated tab that protocol handler is available and working.
    const echoReplyKey = `echo-reply-${queryDict.echoReply}`
    // Set the echo-reply result in localStorage for the other window to see.
    window.localStorage.setItem(echoReplyKey, 'success')
    // Redirect back to the localhost auth url, as opposed to another protocol launch.
    // This will re-use the same tab rather than creating another useless one.
    window.setTimeout(() => {
      window.location.href = decodeURIComponent(<string>queryDict.authContinuation)
    }, 10)
  }
}())

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
  nextYear, nextMonth, nextHour, makeUUID4, updateQueryStringParameter,
  isLaterVersion, isSameOriginAbsoluteUrl, hexStringToECPair, ecPairToHexString,
  ecPairToAddress
} from './utils'

export {
  transactions, safety, TransactionSigner,
  PubkeyHashSigner, addUTXOsToFund, estimateTXBytes
} from './operations'

export { BlockstackWallet, IdentityKeyPair } from './wallet'

export { network } from './network'

// @ts-ignore: Could not find a declaration file for module
export { decodeToken } from 'jsontokens'

export { config } from './config'

export { encryptMnemonic, decryptMnemonic } from './encryption'

export { UserSession } from './auth/userSession'
