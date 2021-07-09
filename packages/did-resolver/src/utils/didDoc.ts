import { DIDDocument } from 'did-resolver'
const b58 = require('bs58')

export const buildDidDoc = ({
  did,
  publicKey,
  tokenUrl
}: {
  did: string
  publicKey: string
  tokenUrl: string
}): DIDDocument => {
  return {
    '@context': 'https://www.w3.org/ns/did/v1',
    id: did,
    verificationMethod: [
      {
        id: `${did}#keys-1`,
        controller: `${did}`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        publicKeyBase58: b58.encode(Buffer.from(publicKey, 'hex')),
      },
    ],
    service: [buildServiceEndpointSection(tokenUrl)],
    authentication: [`${did}#keys-1`],
    assertionMethod: [`${did}#keys-1`],
  }
}

const buildServiceEndpointSection = (gaiaHubUrl: string) => {
    return {
      type: 'GaiaHub',
      id: '#gaiaStorageHub',
      serviceEndpoint: gaiaHubUrl,
    }
}
