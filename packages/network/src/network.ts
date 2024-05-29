import { DEVNET_URL, HIRO_MAINNET_URL, HIRO_TESTNET_URL } from '@stacks/common';
import { AddressVersion, ChainId, PeerNetworkId, TransactionVersion } from './constants';

export interface StacksNetwork {
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
}

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
};

export const STACKS_DEVNET: StacksNetwork = {
  ...STACKS_TESTNET,
  magicBytes: 'id', // todo: comment bytes version of magic bytes
};
export const STACKS_MOCKNET: StacksNetwork = { ...STACKS_DEVNET };

/** @ignore internal */
export const StacksNetworks = ['mainnet', 'testnet', 'devnet', 'mocknet'] as const;
/** The enum-style names of different common Stacks networks */
export type StacksNetworkName = (typeof StacksNetworks)[number];

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

export function networkFrom(network: StacksNetworkName | StacksNetwork) {
  if (typeof network === 'string') return networkFromName(network);
  return network;
}

export function deriveDefaultUrl(network?: StacksNetwork | StacksNetworkName) {
  if (!network) return HIRO_MAINNET_URL; // default to mainnet if no network is given

  network = networkFrom(network);

  return !network || network.transactionVersion === TransactionVersion.Mainnet
    ? HIRO_MAINNET_URL // default to mainnet if txVersion is mainnet
    : network.magicBytes === 'id'
      ? DEVNET_URL // default to devnet if magicBytes are devnet
      : HIRO_TESTNET_URL;
}
