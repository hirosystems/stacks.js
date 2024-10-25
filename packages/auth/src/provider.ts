import { decodeToken } from 'jsontokens';
import { BLOCKSTACK_HANDLER, getGlobalObject } from '@stacks/common';
import { createFetchFn, FetchFn } from '@stacks/network';

/**
 * Retrieves the authentication request from the query string
 * @return {String|null} the authentication request or `null` if
 * the query string parameter `authRequest` is not found
 * @private
 * @ignore
 */
export function getAuthRequestFromURL(): string | null {
  const location = getGlobalObject('location', {
    throwIfUnavailable: true,
    usageDesc: 'getAuthRequestFromURL',
  });

  const params = new URLSearchParams(location?.search);
  return params.get('authRequest')?.replaceAll(`${BLOCKSTACK_HANDLER}:`, '') ?? null;
}

/**
 * Fetches the contents of the manifest file specified in the authentication request
 *
 * @param  {String} authRequest encoded and signed authentication request
 * @return {Promise<Object|String>} Returns a `Promise` that resolves to the JSON
 * object manifest file unless there's an error in which case rejects with an error
 * message.
 * @private
 * @ignore
 */
export async function fetchAppManifest(
  authRequest: string,
  fetchFn: FetchFn = createFetchFn()
): Promise<any> {
  if (!authRequest) {
    throw new Error('Invalid auth request');
  }
  const payload = decodeToken(authRequest).payload;
  if (typeof payload === 'string') {
    throw new Error('Unexpected token payload type of string');
  }
  const manifestURI = payload.manifest_uri as string;
  try {
    // Logger.debug(`Fetching manifest from ${manifestURI}`)
    const response = await fetchFn(manifestURI);
    const responseText = await response.text();
    const responseJSON = JSON.parse(responseText);
    return { ...responseJSON, manifestURI };
  } catch (error) {
    console.log(error);
    throw new Error('Could not fetch manifest.json');
  }
}
