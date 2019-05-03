
/** @ignore */
export function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  if (!init) {
    init = { referrerPolicy: 'no-referrer' }
  } else {
    init.referrerPolicy = 'no-referrer'
  }
  return fetch(input, init)
}
