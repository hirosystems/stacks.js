

import { config } from '../config'

/**
* @ignore
*/
function isNameValid(fullyQualifiedName: string = '') {
  const NAME_PART_RULE = /^[a-z0-9\-_+]+$/
  const LENGTH_MAX_NAME = 37

  if (!fullyQualifiedName
      || fullyQualifiedName.length > LENGTH_MAX_NAME) {
    return Promise.resolve(false)
  }
  const nameParts = fullyQualifiedName.split('.')
  if (nameParts.length !== 2) {
    return Promise.resolve(false)
  }
  return Promise.resolve(
    nameParts.reduce(
      (agg, namePart) => {
        if (!agg) {
          return false
        } else {
          return NAME_PART_RULE.test(namePart)
        }
      }, true
    )
  )
}

/**
* @ignore
*/
function isNamespaceValid(namespaceID: string) {
  const NAMESPACE_RULE = /^[a-z0-9\-_]{1,19}$/
  return Promise.resolve(
    namespaceID.match(NAMESPACE_RULE) !== null
  )
}

/**
* @ignore
*/
function isNameAvailable(fullyQualifiedName: string) {
  return config.network.getNameInfo(fullyQualifiedName)
    .then(() => false)
    .catch((e) => {
      if (e.message === 'Name not found') {
        return true
      } else {
        throw e
      }
    })
}

/**
* @ignore
*/
function isNamespaceAvailable(namespaceID: string) {
  return config.network.getNamespaceInfo(namespaceID)
    .then(() => false)
    .catch((e) => {
      if (e.message === 'Namespace not found') {
        return true
      } else {
        throw e
      }
    })
}       

/**
* @ignore
*/
function ownsName(fullyQualifiedName: string, ownerAddress: string) {
  return config.network.getNameInfo(fullyQualifiedName)
    .then(nameInfo => nameInfo.address === ownerAddress)
    .catch((e) => {
      if (e.message === 'Name not found') {
        return false
      } else {
        throw e
      }
    })
}

/**
* @ignore
*/
function revealedNamespace(namespaceID: string, revealAddress: string) {
  return config.network.getNamespaceInfo(namespaceID)
    .then(namespaceInfo => namespaceInfo.recipient_address === revealAddress)
    .catch((e) => {
      if (e.message === 'Namespace not found') {
        return false
      } else {
        throw e
      }
    })
}

/**
* @ignore
*/
function namespaceIsReady(namespaceID: string) {
  return config.network.getNamespaceInfo(namespaceID)
    .then(namespaceInfo => namespaceInfo.ready)
    .catch((e) => {
      if (e.message === 'Namespace not found') {
        return false
      } else {
        throw e
      }
    })
}

/**
* @ignore
*/
function namespaceIsRevealed(namespaceID: string) {
  return config.network.getNamespaceInfo(namespaceID)
    .then(namespaceInfo => !namespaceInfo.ready)
    .catch((e) => {
      if (e.message === 'Namespace not found') {
        return false
      } else {
        throw e
      }
    })
}

/**
* @ignore
*/
function isInGracePeriod(fullyQualifiedName: string) {
  const network = config.network
  return Promise.all([network.getNameInfo(fullyQualifiedName),
                      network.getBlockHeight(),
                      network.getGracePeriod(fullyQualifiedName)])
    .then(([nameInfo, blockHeight, gracePeriod]) => {
      const expiresAt = nameInfo.expire_block
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

/**
* @ignore
*/
function addressCanReceiveName(address: string) {
  return config.network.getNamesOwned(address)
    .then(names => (Promise.all(names.map(name => isNameValid(name)))
      .then(validNames => validNames.filter(nameValid => nameValid).length < 25)))
}

/**
* @ignore
*/
function isAccountSpendable(address: string, tokenType: string, blockHeight: number) {
  return config.network.getAccountStatus(address, tokenType)
    .then(accountStatus => accountStatus.transfer_send_block_id >= blockHeight)
}

/**
* @ignore
*/
export const safety = {
  addressCanReceiveName,
  isInGracePeriod,
  ownsName,
  isNameAvailable,
  isNameValid,
  isNamespaceValid,
  isNamespaceAvailable,
  revealedNamespace,
  namespaceIsReady,
  namespaceIsRevealed,
  isAccountSpendable
}
