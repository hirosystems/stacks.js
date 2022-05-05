import { resolveZoneFileToProfile } from '@stacks/profile';
import { getNameInfo, StacksMainnet, StacksNetwork } from '@stacks/network';

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
export function lookupProfile(lookupOptions: ProfileLookupOptions): Promise<Record<string, any>> {
  if (!lookupOptions.username) {
    return Promise.reject(new Error('No username provided'));
  }

  const defaultOptions = {
    network: StacksMainnet,
  };
  const options = Object.assign(defaultOptions, lookupOptions);

  let lookupPromise;
  if (options.zoneFileLookupURL) {
    const url = `${options.zoneFileLookupURL.replace(/\/$/, '')}/${options.username}`;
    lookupPromise = options.network.fetchFn(url).then((response: Response) => response.json());
  } else {
    lookupPromise = getNameInfo(options.network, options.username);
  }
  return lookupPromise.then((responseJSON: any) => {
    if (responseJSON.hasOwnProperty('zonefile') && responseJSON.hasOwnProperty('address')) {
      return resolveZoneFileToProfile(
        responseJSON.zonefile,
        responseJSON.address,
        options.network.fetchFn
      );
    } else {
      throw new Error(
        'Invalid zonefile lookup response: did not contain `address`' + ' or `zonefile` field'
      );
    }
  });
}
