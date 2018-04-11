/* @flow */
import { resolveZoneFileToProfilePublicKey } from './profileZoneFiles'
import { config } from '../config'

export function lookupUserInfo(username: string, zoneFileLookupURL: ?string = null) {
  if (!username) {
    return Promise.reject()
  }
  let lookupPromise
  if (zoneFileLookupURL) {
    const url = `${zoneFileLookupURL.replace(/\/$/, '')}/${username}`
    lookupPromise = fetch(url)
      .then(response => response.json())
  } else {
    lookupPromise = config.network.getNameInfo(username)
  }

  return lookupPromise
    .then(nameResponse => {
      if (nameResponse.hasOwnProperty('zonefile')
          && nameResponse.hasOwnProperty('address')) {
        const zoneFile = nameResponse.zonefile
        const ownerAddress = nameResponse.address
        return resolveZoneFileToProfilePublicKey(zoneFile, ownerAddress)
          .then(profileResponse => ({
            profile: profileResponse.profile,
            ownerPublicKey: profileResponse.publicKey,
            ownerAddress, zoneFile }))
      } else {
        throw new Error('Invalid zonefile lookup response: did not contain `address`' +
                        ' or `zonefile` field')
      }
    })
}

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username - The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, lookupProfile will use the
 * blockstack.js getNameInfo function.
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(username: string, zoneFileLookupURL: ?string = null) {
  return lookupUserInfo(username, zoneFileLookupURL)
    .then(response => response.profile)
}
