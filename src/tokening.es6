import {
    PrivateKeychain, PublicKeychain, getChildKeypair, getEntropy
} from 'elliptic-keychain'
import { crypto as hashing } from 'bitcoinjs-lib'
import { decodeToken, TokenSigner, TokenVerifier } from 'jwt-js'
import { secp256k1 } from 'elliptic-curve'

function signProfileTokens(profileComponents, privateKeychain, signingAlgorithm = 'ES256K') {
  if (!privateKeychain instanceof PrivateKeychain) {
    throw new Error('Invalid private keychain')
  }

  let ellipticCurve
  if (signingAlgorithm === 'ES256K') {
    ellipticCurve = secp256k1
  } else {
    throw new Error('Signing algorithm not supported')
  }

  let tokenRecords = [],
      parentPublicKey = privateKeychain.publicKeychain().publicKey('hex')

  profileComponents.map((data) => {
    let derivationEntropy = hashing.sha256(
      Buffer.concat([
        privateKeychain.privateKey(),
        new Buffer(JSON.stringify(data))
      ])
    )

    const privateChildKeychain = privateKeychain.child(derivationEntropy),
          privateKey = privateChildKeychain.privateKey('hex'),
          publicKey = privateChildKeychain.publicKeychain().publicKey('hex')

    const payload = {
      claim: data,
      subject: publicKey,
      issuedAt: new Date(),
      expiresAt: new Date().setYear(new Date().getFullYear() + 1)
    }

    const tokenSigner = new TokenSigner(signingAlgorithm, privateKey),
          token = tokenSigner.sign(payload)

    const tokenRecord = {
      token: token,
      data: decodeToken(token),
      publicKey: publicKey,
      parentPublicKey: parentPublicKey,
      derivationEntropy: derivationEntropy.toString('hex'),
      encrypted: false
    }

    tokenRecords.push(tokenRecord)
  })

  return tokenRecords
}

function validateTokenRecord(tokenRecord, publicKeychain) {
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

  let childKeychain = publicKeychain.child(new Buffer(tokenRecord.derivationEntropy, 'hex'))
  if (childKeychain.publicKey('hex') !== tokenRecord.publicKey) {
    throw new Error('Child public key is not a valid child of the parent public key')
  }

  return
}

function getProfileFromTokens(tokenRecords, publicKeychain) {
  let profile = {}

  tokenRecords.map((tokenRecord) => {
    let token = tokenRecord.token,
        decodedToken = decodeToken(token)

    validateTokenRecord(tokenRecord, publicKeychain)

    profile = Object.assign({}, profile, decodedToken.payload.claim)
  })

  return profile
}

export default {
  signProfileTokens,
  getProfileFromTokens,
  validateTokenRecord
}
