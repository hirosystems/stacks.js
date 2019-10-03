import 'cross-fetch/polyfill'

/** @ignore */
export async function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const fetchOpts = init || { }
  fetchOpts.referrerPolicy = 'no-referrer'
  fetchOpts.cache = 'no-cache'
  const fetchResult = await fetch(input, fetchOpts)
  return fetchResult
}
