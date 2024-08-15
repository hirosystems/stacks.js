import { StacksNetwork } from '@stacks/network';
import { default as createOpenApiClient, ClientOptions } from 'openapi-fetch';
import type { paths } from './schema';

export function createClient(network: StacksNetwork, options?: ClientOptions) {
  return createOpenApiClient<paths>({
    baseUrl: network.coreApiUrl,
    fetch: req => network.fetchFn(req.url, req),
    ...options,
  });
}

export * from './helper-types';
export * from 'openapi-fetch';
