import {
  ClientOpts,
  DEVNET_URL,
  FetchFn,
  HIRO_MAINNET_URL,
  HIRO_TESTNET_URL,
  createFetchFn,
} from '@stacks/common';
import { AddressVersion, ChainId, PeerNetworkId, TransactionVersion } from './constants';
import { ClientParam } from '@stacks/common';

export type StacksNetwork = {
  chainId: number;
  transactionVersion: number; // todo: txVersion better?
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
