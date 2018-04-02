/* @flow */
import { resolveZoneFileToProfile } from './profileZoneFiles'
import { config } from '../config'

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username The Blockstack ID of the profile to look up
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(username: string) {
  return new Promise((resolve, reject) => {
    if (!username) {
      reject()
    }
    try {
      config.network.getNameInfo(username)
        .then(responseJSON => {
          if (responseJSON.hasOwnProperty('zonefile')
            && responseJSON.hasOwnProperty('address')) {
            resolve(resolveZoneFileToProfile(responseJSON.zonefile, responseJSON.address))
          } else {
            reject()
          }
        })
        .catch((e) => {
          reject(e)
        })
    } catch (e) {
      reject(e)
    }
  })
}
