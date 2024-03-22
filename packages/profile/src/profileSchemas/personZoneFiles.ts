import { createFetchFn, FetchFn } from '@stacks/common';
import { parseZoneFile } from 'zone-file';

import { getTokenFileUrl, Person } from '../profile';
import { extractProfile } from '../profileTokens';

/**
 *
 * @param zoneFile
 * @param publicKeyOrAddress
 * @param callback
 *
 * @ignore
 */
export function resolveZoneFileToPerson(
  zoneFile: any,
  publicKeyOrAddress: string,
  callback: (profile: any) => void,
  fetchFn: FetchFn = createFetchFn()
) {
  let zoneFileJson = null;
  try {
    zoneFileJson = parseZoneFile(zoneFile);
    if (!zoneFileJson.hasOwnProperty('$origin')) {
      zoneFileJson = null;
      throw new Error('zone file is missing an origin');
    }
  } catch (e) {
    console.error(e);
  }

  let tokenFileUrl = null;
  if (zoneFileJson && Object.keys(zoneFileJson).length > 0) {
    tokenFileUrl = getTokenFileUrl(zoneFileJson);
  } else {
    let profile = null;
    try {
      profile = JSON.parse(zoneFile);
      const person = Person.fromLegacyFormat(profile);
      profile = person.profile();
    } catch (error) {
      console.warn(error);
    }
    callback(profile);
    return;
  }

  if (tokenFileUrl) {
    fetchFn(tokenFileUrl)
      .then((response: any) => response.text())
      .then((responseText: any) => JSON.parse(responseText))
      .then((responseJson: any) => {
        const tokenRecords = responseJson;
        const token = tokenRecords[0].token;
        const profile = extractProfile(token, publicKeyOrAddress);

        callback(profile);
      })
      .catch((error: any) => {
        console.warn(error);
      });
  } else {
    console.warn('Token file url not found');
    callback({});
  }
}
