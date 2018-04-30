/* @flow */

import { config, lookupProfile } from './index'
import { Logger as logger } from './logger'

/**
 * Use the configured blockstack search endpoint to obtain a list of
 *  registered (and pending) names. This returns both results from the
 *  search endpoint _and_ results from performing a simple `lookupName`
 *  query. This allows the return of names which haven't yet been indexed
 *  by the configured search endpoint.
 * @param {String} query - This is the query (or username) to search for.
 * The query is both _searched_ using the configured search API endpoint,
 * and also checked for an exact match on the username. For a given query
 * string (e.g., 'foo'), the exact match username attempted will be
 * 'foo.id'.
 * @param {Object} options - an options argument
 * @param {boolean} options.tryIdNamespace - this tells the search
 * endpoint to try to default to the `.id` namespace when looking for
 * exact matches. If false, this will instead search for exactly the
 * query string (e.g., if you pass 'foo.bar', it tries 'foo.bar', not
 * 'foo.bar.id'). Defaults to true.
 * @returns {Promise} with an array of result objects. Each result object
 *  is of the type { username: string, openbazaar: ?string, profile: Object }.
 */
export function searchUser(query: string, options?: {tryIdNamespace?: boolean}) {
  const defaults = { tryIdNamespace: true }
  const opt = Object.assign({}, defaults, options)

  const searchUrl = `${config.searchApiUrl}/v1/search?query=${query}`
  const searchPromise = fetch(searchUrl)
        .then(resp => resp.json())
        .then(searchResp => searchResp.results)
        .catch((err) => {
          logger.warn(`Error searching for ${query}: ${err}. Returning []`)
          return []
        })

  let lookupName
  if (opt.tryIdNamespace) {
    lookupName = `${query}.id`
  } else {
    lookupName = query
  }
  const lookupPromise = lookupProfile(lookupName)
        .then(profile => {
          // remove the namespace from the query to get the username
          const username = lookupName.split('.').slice(0, -1).join('.')
          return [{ profile,
                    username,
                    openbazaar: null }]
        })
        .catch(() => ([]))

  return Promise.all([searchPromise, lookupPromise])
    .then(([searchResults, lookupResults]) => {
      const results = []

      lookupResults.forEach(x => results.push(x))
      searchResults.forEach(x => results.push(x))

      return { results }
    })
}
