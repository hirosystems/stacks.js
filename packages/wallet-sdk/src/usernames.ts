import { fetchPrivate } from '@stacks/common';
import { StacksNetwork } from '@stacks/network';

export const fetchFirstName = async (
  address: string,
  network: StacksNetwork
): Promise<string | undefined> => {
  try {
    const namesResponse = await fetchPrivate(
      `${network.bnsLookupUrl}/v1/addresses/stacks/${address}`
    );
    const names = await namesResponse.json();
    if ((names.length || 0) > 0) {
      return names[0];
    }
  } catch (e) {}
  return undefined;
};
