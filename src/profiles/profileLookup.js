/* @flow */
import { resolveZoneFileToProfile } from './profileZoneFiles'

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} name The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=http://localhost:6270/v1/names/] The URL
 * to use for zonefile lookup 
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(name: string, zoneFileLookupURL: string = 'http://localhost:6270/v1/names/') {
  return new Promise((resolve, reject) => {
    if (!name) {
      reject()
    }
    const url = `${zoneFileLookupURL.replace(/\/$/, '')}/${name}`
    try {
      fetch(url)
        .then(response => response.text())
        .then(responseText => JSON.parse(responseText))
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
