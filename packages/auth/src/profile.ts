import { ClientOpts, ClientParam, defaultClientOpts } from '@stacks/common';
import { resolveZoneFileToProfile } from '@stacks/profile';

export interface ProfileLookupOptions {
  username: string;
  zoneFileLookupURL?: string;
  api?: ClientOpts;
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
    return Promise.reject(new Error('No username provided'));
  }

  const api = defaultClientOpts(options.api);

  let lookupPromise;
  if (options.zoneFileLookupURL) {
    const url = `${options.zoneFileLookupURL.replace(/\/$/, '')}/${options.username}`;
    lookupPromise = api.fetch(url).then(response => response.json());
  } else {
    lookupPromise = getNameInfo({ name: options.username, client: api });
  }
  return lookupPromise.then((responseJSON: any) => {
    if (responseJSON.hasOwnProperty('zonefile') && responseJSON.hasOwnProperty('address')) {
      return resolveZoneFileToProfile({
        zoneFile: responseJSON.zonefile,
        publicKeyOrAddress: responseJSON.address,
        client: api,
      });
    } else {
      throw new Error(
        'Invalid zonefile lookup response: did not contain `address`' + ' or `zonefile` field'
      );
    }
  });
}

export function getNameInfo(
  opts: {
    /** Fully qualified name */
    name: string;
  } & ClientParam
) {
  const api = defaultClientOpts(opts.client);

  const nameLookupURL = `${api.baseUrl}/v1/names/${opts.name}`;
  return api
    .fetch(nameLookupURL)
    .then((resp: any) => {
      if (resp.status === 404) {
        throw new Error('Name not found');
      } else if (resp.status !== 200) {
        throw new Error(`Bad response status: ${resp.status}`);
      } else {
        return resp.json();
      }
    })
    .then((nameInfo: any) => {
      // the returned address _should_ be in the correct network ---
      //  stacks node gets into trouble because it tries to coerce back to mainnet
      //  and the regtest transaction generation libraries want to use testnet addresses
      if (nameInfo.address) {
        return Object.assign({}, nameInfo, { address: nameInfo.address });
      } else {
        return nameInfo;
      }
    });
}
