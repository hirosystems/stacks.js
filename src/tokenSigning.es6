import {
    PrivateKeychain, PublicKeychain
} from 'elliptic-keychain'
import { crypto as hashing, ECPair as EllipticKeyPair } from 'bitcoinjs-lib'
import { decodeToken, TokenSigner } from 'jwt-js'
import BigInteger from 'bigi'
import { nextYear } from './utils'

export function signTokenRecord(claim, subject, issuerPrivateKey,
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
    let tokenRecord = signTokenRecord(data, subject, privateKey, signingAlgorithm)
    tokenRecord.parentPublicKey = parentPublicKey
    tokenRecord.derivationEntropy = derivationEntropy.toString('hex')

    tokenRecords.push(tokenRecord)
  })

  return tokenRecords
}
