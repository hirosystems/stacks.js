import {
    PrivateKeychain, PublicKeychain
} from 'blockstack-keychains'
import { crypto as hashing, ECPair as EllipticKeyPair } from 'bitcoinjs-lib'
import { decodeToken, TokenSigner } from 'jwt-js'
import BigInteger from 'bigi'
import { nextYear } from './utils'

export function signToken(claim, signingPrivateKey, subject, issuer=null,
                          signingAlgorithm='ES256K', issuedAt=new Date(),
                          expiresAt=nextYear()) {

  if (signingAlgorithm !== 'ES256K') {
    throw new Error('Signing algorithm not supported')
  }

  const privateKeyBigInteger = BigInteger.fromBuffer(new Buffer(signingPrivateKey, 'hex')),
        ellipticKeyPair = new EllipticKeyPair(privateKeyBigInteger, null, {}),
        issuerPublicKey = ellipticKeyPair.getPublicKeyBuffer().toString('hex')

  if (issuer === null) {
    issuer = {
      publicKey: issuerPublicKey
    }
  }

  const payload = {
    claim: claim,
    subject: subject,
    issuer: issuer,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString()
  }

  const tokenSigner = new TokenSigner(signingAlgorithm, signingPrivateKey),
        token = tokenSigner.sign(payload)

  return token
}

export function wrapToken(token) {
  return {
    token: token,
    decodedToken: decodeToken(token),
    encrypted: false
  }
}

export function signTokenRecords(profileComponents, privateKeychain,
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
    let token = signToken(data, privateKey, subject, null, signingAlgorithm),
        tokenRecord = wrapToken(token)
    tokenRecord.parentPublicKey = parentPublicKey
    tokenRecord.derivationEntropy = derivationEntropy.toString('hex')

    tokenRecords.push(tokenRecord)
  })

  return tokenRecords
}
