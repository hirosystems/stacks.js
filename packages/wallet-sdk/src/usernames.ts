import { ClientParam, defaultClientOpts } from '@stacks/common';

export const fetchFirstName = async (
  opts: {
    address: string;
  } & ClientParam
): Promise<string | undefined> => {
  const client = defaultClientOpts(opts.client);
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
