import { BlockstackNetwork } from './network'

export function isNameAvailable(fullyQualifiedName: string, network: BlockstackNetwork) {
  return network.getNameInfo(fullyQualifiedName)
    .then(() => false)
    .catch((e) => {
      if (e.message === 'Name not found') {
        return true
      } else {
        throw e
      }
    })
}

export function ownsName(fullyQualifiedName: string, ownerAddress: string,
                         network: BlockstackNetwork) {
  return network.getNameInfo(fullyQualifiedName)
    .then((nameInfo) => nameInfo === ownerAddress)
    .catch((e) => {
      if (e.message === 'Name not found') {
        return false
      } else {
        throw e
      }
    })
}

export function isInGracePeriod(fullyQualifiedName: string, network: BlockstackNetwork) {
  return Promise.all([network.getNameInfo(fullyQualifiedName),
                      network.getBlockHeight(),
                      network.getGracePeriod(fullyQualifiedName)])
    .then(([nameInfo, blockHeight, gracePeriod]) => {
      const expiresAt = nameInfo.expires_block
      return (blockHeight >= expiresAt) && (blockHeight < (gracePeriod + expiresAt))
    })
    .catch((e) => {
      if (e.message === 'Name not found') {
        return false
      } else {
        throw e
      }
    })
}

export function addressCanReceiveName(address: string, network: BlockstackNetwork) {
  return network.getNamesOwned(address)
    .then((names) => (names.length < 25))
}
