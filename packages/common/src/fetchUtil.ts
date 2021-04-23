import 'cross-fetch/polyfill';

/** @ignore */
export async function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const defaultFetchOpts: RequestInit = {
    referrer: 'no-referrer',
    referrerPolicy: 'no-referrer',
  };
  const fetchOpts = Object.assign(defaultFetchOpts, init);
  const fetchResult = await fetch(input, fetchOpts);
  return fetchResult;
}
