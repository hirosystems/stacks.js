
/** @ignore */
export function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  init = init || { }
  init.referrerPolicy = 'no-referrer'
  return fetch(input, init)
}
