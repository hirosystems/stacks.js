import {
    PrivateKeychain, PublicKeychain, getChildKeypair, getEntropy
} from 'elliptic-keychain'
import { crypto as hashing, ECPair as EllipticKeyPair } from 'bitcoinjs-lib'
import { decodeToken, TokenSigner, TokenVerifier } from 'jwt-js'
import { secp256k1 } from 'elliptic-curve'
import * as BigInteger from 'bigi'
import { nextYear } from './utils'

export function signRecord(claim, subject, issuerPrivateKey,
                           signingAlgorithm='ES256K', issuedAt=new Date(),
                           expiresAt=nextYear()) {

  if (signingAlgorithm !== 'ES256K') {
    throw new Error('Signing algorithm not supported')
  }

  const payload = {
    claim: claim,
    subject: subject,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  }

  const tokenSigner = new TokenSigner(signingAlgorithm, issuerPrivateKey),
        token = tokenSigner.sign(payload)

  const privateKeyBigInteger = BigInteger.fromBuffer(new Buffer(issuerPrivateKey, 'hex')),
        ellipticKeyPair = new EllipticKeyPair(privateKeyBigInteger, null, {}),
        issuerPublicKey = ellipticKeyPair.getPublicKeyBuffer().toString('hex')

  return {
    token: token,
    data: decodeToken(token),
    publicKey: issuerPublicKey,
    encrypted: false
  }
}

export function signRecords(profileComponents, privateKeychain,
                           signingAlgorithm='ES256K') {

  if (!privateKeychain instanceof PrivateKeychain) {
    throw new Error('Invalid private keychain')
  }

  if (signingAlgorithm !== 'ES256K') {
    throw new Error('Signing algorithm not supported')
  }

  let tokenRecords = [],
      parentPublicKey = privateKeychain.publicKeychain().publicKey('hex')

  profileComponents.map((data) => {
    const derivationEntropy = hashing.sha256(
      Buffer.concat([
        privateKeychain.privateKey(),
        new Buffer(JSON.stringify(data))
      ])
    )

    const privateChildKeychain = privateKeychain.child(derivationEntropy),
          privateKey = privateChildKeychain.privateKey('hex'),
          publicKey = privateChildKeychain.publicKeychain().publicKey('hex')

    const subject = {publicKey: publicKey}
    let tokenRecord = signRecord(data, subject, privateKey, signingAlgorithm)
    tokenRecord.parentPublicKey = parentPublicKey
    tokenRecord.derivationEntropy = derivationEntropy.toString('hex')

    tokenRecords.push(tokenRecord)
  })

  return tokenRecords
}

export function validateTokenRecord(tokenRecord, publicKeychain) {
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

  return
}

export function getProfileFromTokens(tokenRecords, publicKeychain) {
  let profile = {}

  tokenRecords.map((tokenRecord) => {
    let token = tokenRecord.token,
        decodedToken = decodeToken(token)

    validateTokenRecord(tokenRecord, publicKeychain)

    profile = Object.assign({}, profile, decodedToken.payload.claim)
  })

  return profile
}
