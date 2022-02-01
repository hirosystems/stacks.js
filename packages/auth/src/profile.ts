import { resolveZoneFileToProfile } from '@stacks/profile';
import { fetchPrivate } from '@stacks/common';
import { StacksMainnet, StacksNetwork, StacksNetworkName } from '@stacks/network';

export interface ProfileLookupOptions {
  username: string;
  zoneFileLookupURL?: string;
  network?: StacksNetworkName | StacksNetwork;
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
export function lookupProfile(lookupOptions: ProfileLookupOptions): Promise<Record<string, any>> {
  if (!lookupOptions.username) {
    return Promise.reject(new Error('No username provided'));
  }

  const defaultOptions = {
    network: new StacksMainnet(),
  };
  const options = Object.assign(defaultOptions, lookupOptions);

  const network = StacksNetwork.fromNameOrNetwork(options.network);
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
