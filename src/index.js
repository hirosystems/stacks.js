import queryString from 'query-string'

// HACK - Redirect back to the authentication flow when the protocol-echo reply is detected.
// Putting in here so it executes ASAP. There is probably a better place to put this.
const queryDict = queryString.parse(location.search)
// If echoReply is in the query string then this page was only opened to signal
// the originating tab that the protocol handler is installed. 
if (queryDict.echoReply) {
  // Use localStorage to notify originated tab that protocol handler is available and working.
  const echoReplyKey = `echo-reply-${queryDict.echoReply}`
  window.localStorage.setItem(echoReplyKey, 'success')
  // Redirect back to the localhost auth url, as opposed to another protocol launch.
  // This will re-use the same tab rather than creating another useless one.
  window.location = decodeURIComponent(queryDict.authContinuation)
}

export {
  isUserSignedIn, redirectToSignIn, redirectToSignInWithAuthRequest,
  getAuthResponseToken, isSignInPending,
  handlePendingSignIn, loadUserData, signUserOut,
  generateAndStoreTransitKey, getTransitKey
} from './auth/authApp'

export {
  makeAuthRequest, makeAuthResponse
} from './auth/authMessages'

export {
  getAuthRequestFromURL, fetchAppManifest, redirectUserToApp
} from './auth/authProvider'

export {
  makeCoreSessionRequest, sendCoreSessionRequest, getCoreSession
} from './auth/authSession'

export {
  verifyAuthRequest, verifyAuthResponse,
  isExpirationDateValid, isIssuanceDateValid, doPublicKeysMatchUsername,
  doPublicKeysMatchIssuer, doSignaturesMatchPublicKeys,
  isManifestUriValid, isRedirectUriValid, verifyAuthRequestAndLoadManifest
} from './auth/authVerification'

export {
  Profile
} from './profiles/profile'

export { 
  Person, Organization, CreativeWork, resolveZoneFileToPerson
} from './profiles/profileSchemas'

export {
  signProfileToken, wrapProfileToken, verifyProfileToken, extractProfile
} from './profiles/profileTokens'

export {
  validateProofs
} from './profiles/profileProofs'

export {
  profileServices, containsValidProofStatement, containsValidAddressProofStatement
} from './profiles/services'

export {
  makeProfileZoneFile, getTokenFileUrl, resolveZoneFileToProfile
} from './profiles/profileZoneFiles'

export {
  lookupProfile
} from './profiles/profileLookup'

export { 
  BLOCKSTACK_GAIA_HUB_LABEL, getUserAppFileUrl, getAppBucketUrl, 
  connectToGaiaHub, uploadToGaiaHub, 
  listFiles, deleteFile, putFile, getFile, 
  decryptContent, encryptContent
} from './storage'

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

export { decodeToken } from 'jsontokens'

export { config } from './config'

export { encryptMnemonic, decryptMnemonic } from './encryption'
