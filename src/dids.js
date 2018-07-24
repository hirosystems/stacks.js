import { InvalidDIDError } from './errors'
import { publicKeyToAddress } from './keys'

const DID_STACK_V1 = 'stack:v1'

export function makeDIDFromPublicKey(publicKey) {
  return `did:stack:v1:${publicKey}`
}

export function getDIDType(decentralizedID) {
  const didParts = decentralizedID.split(':')

  if (didParts.length !== 3 && didParts.length !== 4) {
    throw new InvalidDIDError('Decentralized IDs must have 3 or 4 parts')
  }

  if (didParts[0].toLowerCase() !== 'did') {
    throw new InvalidDIDError('Decentralized IDs must start with "did"')
  }

  if (didParts.length === 3) {
    return didParts[1].toLowerCase()
  } else {
    // supports did types such as did:stack:v1:<publicKey>
    return didParts[1].toLowerCase() + didParts[2].toLowerCase()
  }
}

export function getPublicKeyFromDID(decentralizedID) {
  const didType = getDIDType(decentralizedID)
  if (didType === DID_STACK_V1) {
    const publicKey = decentralizedID.split(':')[3]
    return publicKey
  } else {
    throw new InvalidDIDError(`getPublicKeyFromDID only supports ${DID_STACK_V1} DIDs`)
  }
}

export function getAddressFromDID(decentralizedID) {
  const didType = getDIDType(decentralizedID)
  if (didType === 'btc-addr') {
    return decentralizedID.split(':')[2]
  } else if (didType === DID_STACK_V1) {
    const publicKey = getPublicKeyFromDID(decentralizedID)
    return publicKeyToAddress(publicKey)
  } else {
    return new InvalidDIDError(`getAddressFromDID does not support the ${didType} DID type`)
  }
}
