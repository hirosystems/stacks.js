import {
  DEVNET_URL,
  FetchFn,
  HIRO_MAINNET_URL,
  HIRO_TESTNET_URL,
  createFetchFn,
  createApiKeyMiddleware,
  ClientOpts,
  ApiKeyMiddlewareOpts,
} from '@stacks/common';
import { AddressVersion, ChainId, PeerNetworkId, TransactionVersion } from './constants';
import { ClientParam } from '@stacks/common';

export type StacksNetwork = {
  chainId: number;
  transactionVersion: number;
  peerNetworkId: number;
  magicBytes: string;
  bootAddress: string;
  addressVersion: {
    singleSig: number;
    multiSig: number;
  };
  // todo: add check32 character bytes string
  client: {
    baseUrl: string; // URL is always required
    fetch?: FetchFn; // fetch is optional and will be created by default in fetch helpers
  };
};

export interface NetworkParam {
  network?: StacksNetworkName | StacksNetwork;
}

export type NetworkClientParam = NetworkParam & ClientParam;

export const STACKS_MAINNET: StacksNetwork = {
  chainId: ChainId.Mainnet,
  transactionVersion: TransactionVersion.Mainnet,
  peerNetworkId: PeerNetworkId.Mainnet,
  magicBytes: 'X2', // todo: comment bytes version of magic bytes
  bootAddress: 'SP000000000000000000002Q6VF78',
  addressVersion: {
    singleSig: AddressVersion.MainnetSingleSig,
    multiSig: AddressVersion.MainnetMultiSig,
  },
  client: { baseUrl: HIRO_MAINNET_URL },
};

export const STACKS_TESTNET: StacksNetwork = {
  chainId: ChainId.Testnet,
  transactionVersion: TransactionVersion.Testnet,
  peerNetworkId: PeerNetworkId.Testnet,
  magicBytes: 'T2', // todo: comment bytes version of magic bytes
  bootAddress: 'ST000000000000000000002AMW42H',
  addressVersion: {
    singleSig: AddressVersion.TestnetSingleSig,
    multiSig: AddressVersion.TestnetMultiSig,
  },
  client: { baseUrl: HIRO_TESTNET_URL },
};

export const STACKS_DEVNET: StacksNetwork = {
  ...STACKS_TESTNET, // todo: ensure deep copy
  addressVersion: { ...STACKS_TESTNET.addressVersion }, // deep copy
  magicBytes: 'id', // todo: comment bytes version of magic bytes
  client: { baseUrl: DEVNET_URL },
};

export const STACKS_MOCKNET: StacksNetwork = {
  ...STACKS_DEVNET,
  addressVersion: { ...STACKS_DEVNET.addressVersion }, // deep copy
  client: { ...STACKS_DEVNET.client }, // deep copy
};

/** @ignore internal */
export const StacksNetworks = ['mainnet', 'testnet', 'devnet', 'mocknet'] as const;
/** The enum-style names of different common Stacks networks */
export type StacksNetworkName = (typeof StacksNetworks)[number];

/**
 * Returns the default network for a given name
 * @example
 * ```ts
 * networkFromName('mainnet') // same as STACKS_MAINNET
 * networkFromName('testnet') // same as STACKS_TESTNET
 * networkFromName('devnet') // same as STACKS_DEVNET
 * networkFromName('mocknet') // same as STACKS_MOCKNET
 * ```
 */
export function networkFromName(name: StacksNetworkName) {
  switch (name) {
    case 'mainnet':
      return STACKS_MAINNET;
    case 'testnet':
      return STACKS_TESTNET;
    case 'devnet':
      return STACKS_DEVNET;
    case 'mocknet':
      return STACKS_MOCKNET;
    default:
      throw new Error(`Unknown network name: ${name}`);
  }
}

/** @ignore */
export function networkFrom(network: StacksNetworkName | StacksNetwork) {
  if (typeof network === 'string') return networkFromName(network);
  return network;
}

/** @ignore */
export function defaultUrlFromNetwork(network?: StacksNetworkName | StacksNetwork) {
  if (!network) return HIRO_MAINNET_URL; // default to mainnet if no network is given

  network = networkFrom(network);

  return !network || network.transactionVersion === TransactionVersion.Mainnet
    ? HIRO_MAINNET_URL // default to mainnet if txVersion is mainnet
    : network.magicBytes === 'id'
      ? DEVNET_URL // default to devnet if magicBytes are devnet
      : HIRO_TESTNET_URL;
}

/**
 * Returns the client of a network, creating a new fetch function if none is available
 */
export function clientFromNetwork(network: StacksNetwork): Required<ClientOpts> {
  if (network.client.fetch) return network.client as Required<ClientOpts>;
  return {
    ...network.client,
    fetch: createFetchFn(),
  };
}

/**
 * Creates a customized Stacks network.
 *
 * This function allows you to create a network based on a predefined network
 * (mainnet, testnet, devnet, mocknet) or a custom network object. You can also customize
 * the network with an API key or other client options.
 *
 * @example
 * ```ts
 * // Create a basic network from a network name
 * const network = createNetwork('mainnet');
 * const network = createNetwork(STACKS_MAINNET);
 * ```
 *
 * @example
 * ```ts
 * // Create a network with an API key
 * const network = createNetwork('testnet', 'my-api-key');
 * const network = createNetwork(STACKS_TESTNET, 'my-api-key');
 * ```
 *
 * @example
 * ```ts
 * // Create a network with options object
 * const network = createNetwork({
 *   network: 'mainnet',
 *   apiKey: 'my-api-key',
 * });
 * ```
 *
 * @example
 * ```ts
 * // Create a network with options object with custom API key options
 * const network = createNetwork({
 *   network: 'mainnet',
 *   apiKey: 'my-api-key',
 *   host: /\.example\.com$/, // default is /(.*)api(.*)(\.stacks\.co|\.hiro\.so)$/i
 *   httpHeader: 'x-custom-api-key', // default is 'x-api-key'
 * });
 * ```
 *
 * @example
 * ```ts
 * // Create a network with custom client options
 * const network = createNetwork({
 *   network: STACKS_TESTNET,
 *   client: {
 *     baseUrl: 'https://custom-api.example.com',
 *     fetch: customFetchFunction
 *   }
 * });
 * ```
 */
export function createNetwork(network: StacksNetworkName | StacksNetwork): StacksNetwork;
export function createNetwork(
  network: StacksNetworkName | StacksNetwork,
  apiKey: string
): StacksNetwork;
export function createNetwork(
  options: {
    network: StacksNetworkName | StacksNetwork;
    client?: ClientOpts;
  } & Partial<ApiKeyMiddlewareOpts>
): StacksNetwork;
export function createNetwork(
  arg1:
    | StacksNetworkName
    | StacksNetwork
    | ({
        network: StacksNetworkName | StacksNetwork;
        client?: ClientOpts;
      } & Partial<ApiKeyMiddlewareOpts>),
  arg2?: string
): StacksNetwork {
  const baseNetwork = networkFrom(
    typeof arg1 === 'object' && 'network' in arg1 ? arg1.network : arg1
  );

  const newNetwork: StacksNetwork = {
    ...baseNetwork,
    addressVersion: { ...baseNetwork.addressVersion }, // deep copy
    client: { ...baseNetwork.client }, // deep copy
  };

  // Options object argument
  if (typeof arg1 === 'object' && 'network' in arg1) {
    if (arg1.client) {
      newNetwork.client.baseUrl = arg1.client.baseUrl ?? newNetwork.client.baseUrl;
      newNetwork.client.fetch = arg1.client.fetch ?? newNetwork.client.fetch;
    }

    if (typeof arg1.apiKey === 'string') {
      const middleware = createApiKeyMiddleware(arg1 as ApiKeyMiddlewareOpts);
      newNetwork.client.fetch = newNetwork.client.fetch
        ? createFetchFn(newNetwork.client.fetch, middleware)
        : createFetchFn(middleware);
    }

    return newNetwork;
  }

  // Additional API key argument
  if (typeof arg2 === 'string') {
    const middleware = createApiKeyMiddleware({ apiKey: arg2 });
    newNetwork.client.fetch = newNetwork.client.fetch
      ? createFetchFn(newNetwork.client.fetch, middleware)
      : createFetchFn(middleware);
    return newNetwork;
  }

  // Only network argument
  return newNetwork;
}
