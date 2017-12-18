/* @flow */

/**
 * Look up a user profile by blockstack ID
 *
 * @param {Object} name The Blockstack ID of the profile to look up
 * @param {string} [profileLookupURL=https://core.blockstack.org/v2/users/] The URL
 * to use for profile lookup 
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(name: string, profileLookupURL: string = 'https://core.blockstack.org/v2/users/') {
  return new Promise((resolve, reject) => {
    if (!name) {
      reject()
    }
    const url = `${profileLookupURL.replace(/\/$/, '')}/${name}`
    try {
      fetch(url)
        .then(response => response.text())
        .then(responseText => JSON.parse(responseText))
        .then(responseJSON => {
          if (responseJSON.hasOwnProperty(name)) {
            resolve(responseJSON[name].profile)
          } else {
            reject()
          }
        })
        .catch(() => {
          reject()
        })
    } catch (e) {
      reject()
    }
  })
}
