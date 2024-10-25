import { NetworkClientParam, clientFromNetwork, networkFrom } from '@stacks/network';

export const fetchFirstName = async (
  opts: {
    address: string;
  } & NetworkClientParam
): Promise<string | undefined> => {
  const network = networkFrom(opts.network ?? 'mainnet');
  const client = Object.assign({}, clientFromNetwork(network), opts.client);
  try {
    const namesResponse = await client.fetch(
      `${client.baseUrl}/v1/addresses/stacks/${opts.address}`
    );
    const namesJson = await namesResponse.json();
    if ((namesJson.names.length || 0) > 0) {
      return namesJson.names[0];
    }
  } catch (e) {}
  return undefined;
};
