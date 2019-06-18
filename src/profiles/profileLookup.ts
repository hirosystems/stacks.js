
import { resolveZoneFileToProfile } from './profileZoneFiles'
import { config } from '../config'
import { fetchPrivate } from '../fetchUtil'

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username - The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, lookupProfile will use the
 * blockstack.js [[getNameInfo]] function.
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(username: string, zoneFileLookupURL?: string): Promise<any> {
  if (!username) {
    return Promise.reject()
  }
  let lookupPromise
  if (zoneFileLookupURL) {
    const url = `${zoneFileLookupURL.replace(/\/$/, '')}/${username}`
    lookupPromise = fetchPrivate(url)
      .then(response => response.json())
  } else {
    lookupPromise = config.network.getNameInfo(username)
  }
  return lookupPromise
    .then((responseJSON) => {
      if (responseJSON.hasOwnProperty('zonefile')
          && responseJSON.hasOwnProperty('address')) {
        return resolveZoneFileToProfile(responseJSON.zonefile, responseJSON.address)
      } else {
        throw new Error('Invalid zonefile lookup response: did not contain `address`'
                        + ' or `zonefile` field')
      }
    })
}
