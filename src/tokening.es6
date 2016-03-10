import {
    PrivateKeychain, PublicKeychain, getChildKeypair, getEntropy
} from 'elliptic-keychain'
import { crypto as hashing, ECPair } from 'bitcoinjs-lib'
import { decodeToken, TokenSigner, TokenVerifier } from 'jwt-js'
import { secp256k1 } from 'elliptic-curve'
import * as BigInteger from 'bigi'

export function signRecord(record, subject, issuedAt, expiresAt, issuerPrivateKey, signingAlgorithm = 'ES256K') {

  if (signingAlgorithm !== 'ES256K') {
    throw new Error('Signing algorithm not supported')
  }

  const payload = {
    claim: record,
    subject: subject,
    issuedAt: issuedAt,
    expiresAt: expiresAt
  }

  const tokenSigner = new TokenSigner(signingAlgorithm, issuerPrivateKey)
  const token = tokenSigner.sign(payload)
  
  const privKeyBigInt = BigInteger.fromBuffer(new Buffer(issuerPrivateKey, 'hex'))
  const ecPair = new ECPair(privKeyBigInt, null, {})
  const issuerPublicKey = ecPair.getPublicKeyBuffer().toString('hex')
  
  const tokenRecord = {
    token: token,
    data: decodeToken(token),
    publicKey: issuerPublicKey,
    encrypted: false
  }

  return tokenRecord
}

export function signProfileTokens(profileComponents, privateKeychain, signingAlgorithm = 'ES256K') {
  if (!privateKeychain instanceof PrivateKeychain) {
    throw new Error('Invalid private keychain')
  }

  if (signingAlgorithm !== 'ES256K') {
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

    const issuedAt = new Date()
    const expiresAt = new Date(issuedAt.getFullYear()+1, 
                               issuedAt.getMonth(),
                               issuedAt.getDate(),
                               issuedAt.getHours(),
                               issuedAt.getMinutes(),
                               issuedAt.getSeconds(),
                               issuedAt.getMilliseconds())

    const subject = {publicKey: publicKey}
    var tokenRecord = signRecord(data,
                                 subject,
                                 issuedAt,
                                 expiresAt,
                                 privateKey,
                                 signingAlgorithm)

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

  let childKeychain = publicKeychain.child(new Buffer(tokenRecord.derivationEntropy, 'hex'))
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
