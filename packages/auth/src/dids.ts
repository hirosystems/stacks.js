import { InvalidDIDError } from '@stacks/common';

/**
 * @ignore
 */
export function makeDIDFromAddress(address: string) {
  return `did:btc-addr:${address}`;
}

/**
 * @ignore
 */
export function makeDIDFromPublicKey(publicKey: string) {
  return `did:ecdsa-pub:${publicKey}`;
}

/**
 * @ignore
 */
export function getDIDType(decentralizedID: string) {
  const didParts = decentralizedID.split(':');

  if (didParts.length !== 3) {
    throw new InvalidDIDError('Decentralized IDs must have 3 parts');
  }

  if (didParts[0].toLowerCase() !== 'did') {
    throw new InvalidDIDError('Decentralized IDs must start with "did"');
  }

  return didParts[1].toLowerCase();
}

/**
 * @ignore
 */
export function getAddressFromDID(decentralizedID?: string): string | undefined {
  if (decentralizedID) {
    const didType = getDIDType(decentralizedID);
    if (didType === 'btc-addr') {
      return decentralizedID.split(':')[2];
    } else {
      return undefined;
    }
  }
  return undefined;
}

/*
export function getPublicKeyOrAddressFromDID(decentralizedID) {
  const didParts = decentralizedID.split(':')

  if (didParts.length !== 3) {
    throw new InvalidDIDError('Decentralized IDs must have 3 parts')
  }

  if (didParts[0].toLowerCase() !== 'did') {
    throw new InvalidDIDError('Decentralized IDs must start with "did"')
  }

  if (didParts[1].toLowerCase() === 'ecdsa-pub') {
    return didParts[2]
  } else if (didParts[1].toLowerCase() === 'btc-addr') {
    return didParts[2]
  } else {
    throw new InvalidDIDError('Decentralized ID format not supported')
  }
}
*/
