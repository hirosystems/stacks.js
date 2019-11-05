import { getGlobalObject } from './utils'

function getFetch() {
  const availableFetch = getGlobalObject('fetch', { throwIfUnavailable: false, returnEmptyObject: false })
  if (availableFetch) {
    return availableFetch
  } else {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const crossFetch = require('cross-fetch')
    return crossFetch.default
  }
}

/** @ignore */
export async function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const fetchOpts = init || { }
  fetchOpts.referrerPolicy = 'no-referrer'
  // eslint-disable-next-line no-restricted-globals
  const fetchFn = getFetch()
  const fetchResult = await fetchFn(input, fetchOpts)
  return fetchResult
}
