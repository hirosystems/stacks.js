import 'cross-fetch/polyfill';

// Define a default request options and allow modification using getters, setters
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
const defaultFetchOpts: RequestInit = {
  // By default referrer value will be client:origin: above reference link
  referrerPolicy: 'origin', // Use origin value for referrer policy
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
};
/*
 * Get fetch options
 * @return fetchOptions
 */
export const getFetchOptions = () => {
  return defaultFetchOpts;
};
/*
 * Set fetch options
 * Users can change default referrer as well as other options when fetch is used internally by stacks.js libraries or from server side
 * @example
 *  Reference: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
 *  setFetchOptions({  referrer: 'no-referrer', referrerPolicy: 'no-referrer', ... other options as per above reference  });
 * Now all the subsequent fetchPrivate will use above options
 * @return fetchOptions
 */
export const setFetchOptions = (ops: RequestInit) => {
  return Object.assign(defaultFetchOpts, ops);
};

/** @ignore */
export async function fetchPrivate(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const fetchOpts = {};
  // Use the provided options in request options along with default or user provided values
  Object.assign(fetchOpts, init, defaultFetchOpts);

  const fetchResult = await fetch(input, fetchOpts);
  return fetchResult;
}
