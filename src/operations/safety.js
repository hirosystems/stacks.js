/* @flow */

import { config } from '../config'

function isNameValid(fullyQualifiedName: ?string = '') {
  const NAME_PART_RULE = /^[a-z0-9\-_+]+$/
  const LENGTH_MAX_NAME = 37

  if (!fullyQualifiedName ||
      fullyQualifiedName.length > LENGTH_MAX_NAME) {
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
      }, true))
}

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

function ownsName(fullyQualifiedName: string, ownerAddress: string) {
  return config.network.getNameInfo(fullyQualifiedName)
    .then((nameInfo) => nameInfo.address === ownerAddress)
    .catch((e) => {
      if (e.message === 'Name not found') {
        return false
      } else {
        throw e
      }
    })
}

function isInGracePeriod(fullyQualifiedName: string) {
  const network = config.network
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

function addressCanReceiveName(address: string) {
  return config.network.getNamesOwned(address)
    .then((names) => (names.length < 25))
}

export const safety = {
  addressCanReceiveName, isInGracePeriod, ownsName, isNameAvailable, isNameValid
}
