import { resolveZoneFileToProfile } from '@stacks/profile';
import { fetchPrivate } from '@stacks/common';
import { StacksNetwork, StacksMainnet } from '@stacks/network';

export interface ProfileLookupOptions {
  username: string;
  zoneFileLookupURL?: string;
  network?: StacksNetwork;
}

/**
 * Look up a user profile by blockstack ID
 *
 * @param {string} username - The Blockstack ID of the profile to look up
 * @param {string} [zoneFileLookupURL=null] - The URL
 * to use for zonefile lookup. If falsey, lookupProfile will use the
 * blockstack.js [[getNameInfo]] function.
 * @returns {Promise} that resolves to a profile object
 */
export function lookupProfile(options: ProfileLookupOptions): Promise<Record<string, any>> {
  if (!options.username) {
    return Promise.reject();
  }
  const network: StacksNetwork = options.network ? options.network : new StacksMainnet();
  let lookupPromise;
  if (options.zoneFileLookupURL) {
    const url = `${options.zoneFileLookupURL.replace(/\/$/, '')}/${options.username}`;
    lookupPromise = fetchPrivate(url).then(response => response.json());
  } else {
    lookupPromise = network.getNameInfo(options.username);
  }
  return lookupPromise.then((responseJSON: any) => {
    if (responseJSON.hasOwnProperty('zonefile') && responseJSON.hasOwnProperty('address')) {
      return resolveZoneFileToProfile(responseJSON.zonefile, responseJSON.address);
    } else {
      throw new Error(
        'Invalid zonefile lookup response: did not contain `address`' + ' or `zonefile` field'
      );
    }
  });
}
