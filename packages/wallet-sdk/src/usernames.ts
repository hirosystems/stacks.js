import { ApiParam, defaultApiLike } from '@stacks/common';

export const fetchFirstName = async (
  opts: {
    address: string;
  } & ApiParam
): Promise<string | undefined> => {
  const api = defaultApiLike(opts.api);
  try {
    const namesResponse = await api.fetch(`${api.url}/v1/addresses/stacks/${opts.address}`);
    const namesJson = await namesResponse.json();
    if ((namesJson.names.length || 0) > 0) {
      return namesJson.names[0];
    }
  } catch (e) {}
  return undefined;
};
