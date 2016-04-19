'use strict'

import { PrivateKeychain, PublicKeychain } from 'blockstack-keychain'
import { decodeToken, TokenSigner, TokenVerifier } from 'jwt-js'

export function verifyTokenRecord(tokenRecord, publicKeyOrKeychain) {
  if (publicKeyOrKeychain === null) {
    throw new Error('A public key or keychain is required')
  }

  let verifyingPublicKey

  if (typeof publicKeyOrKeychain === 'string') {
    verifyingPublicKey = publicKeyOrKeychain
  } else if (publicKeyOrKeychain instanceof PublicKeychain) {
    let childKeychain = publicKeyOrKeychain.child(
      new Buffer(tokenRecord.derivationEntropy, 'hex'))
    verifyingPublicKey = childKeychain.publicKey('hex')
  } else {
    throw new Error('A valid public key or PublicKeychain object is required')
  }

  let token = tokenRecord.token,
      decodedToken = decodeToken(token),
      issuerPublicKey = null

  if (decodedToken.payload.hasOwnProperty('issuer')) {
    if (decodedToken.payload.issuer.hasOwnProperty('publicKey')) {
      issuerPublicKey = decodedToken.payload.issuer.publicKey
    } else {
      throw new Error('Decoded token does not have an issuer public key')
    }
  } else {
    throw new Error('Decoded token does not have an issuer')
  }

  let tokenVerifier = new TokenVerifier(decodedToken.header.alg, issuerPublicKey)
  if (!tokenVerifier) {
    throw new Error('Invalid token verifier')
  }

  let tokenVerified = tokenVerifier.verify(token)
  if (!tokenVerified) {
    throw new Error('Token verification failed')
  }

  if (verifyingPublicKey !== issuerPublicKey) {
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
