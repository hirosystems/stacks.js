// eslint-disable-next-line import/no-unassigned-import
import 'cross-fetch/polyfill'

/** @ignore */
export async function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const fetchOpts = init || { }
  fetchOpts.referrerPolicy = 'no-referrer'
  // eslint-disable-next-line no-restricted-globals
  const fetchResult = await fetch(input, fetchOpts)
  return fetchResult
}
