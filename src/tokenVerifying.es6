import {
    PrivateKeychain, PublicKeychain
} from 'elliptic-keychain'
import { decodeToken, TokenSigner, TokenVerifier } from 'jwt-js'

export function verifyTokenRecord(tokenRecord, publicKeychain) {
  if (!publicKeychain) {
    throw new Error('A public keychain is required')
  }

  let token = tokenRecord.token,
      decodedToken = decodeToken(token)

  let tokenVerifier = new TokenVerifier(decodedToken.header.alg, tokenRecord.publicKey)
  if (!tokenVerifier) {
    throw new Error('Invalid token verifier')
  }

  let tokenVerified = tokenVerifier.verify(token)
  if (!tokenVerified) {
    throw new Error('Token verification failed')
  }

  let childKeychain = publicKeychain.child(
    new Buffer(tokenRecord.derivationEntropy, 'hex'))
  if (childKeychain.publicKey('hex') !== tokenRecord.publicKey) {
    throw new Error('Child public key is not a valid child of the parent public key')
  }

  return decodedToken
}

export function getProfileFromTokens(tokenRecords, publicKeychain) {
  let profile = {}

  tokenRecords.map((tokenRecord) => {
    let token = tokenRecord.token,
        decodedToken = null
    
    try {
      decodedToken = verifyTokenRecord(tokenRecord, publicKeychain)
    } catch (e) {
      // pass
    }

    if (decodedToken !== null) {
      profile = Object.assign({}, profile, decodedToken.payload.claim)
    }
  })

  return profile
}
