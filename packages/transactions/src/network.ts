import { ChainId, PeerNetworkId, TransactionVersion } from './constants';

export interface StacksNetwork {
  chainId: number;
  transactionVersion: number; // todo: txVersion better?
  peerNetworkId: number;
  magicBytes: string;
  // todo: add check32 character bytes string
}

export const STACKS_MAINNET: StacksNetwork = {
  chainId: ChainId.Mainnet,
  transactionVersion: TransactionVersion.Mainnet,
  peerNetworkId: PeerNetworkId.Mainnet,
  magicBytes: 'X2', // todo: comment bytes version of magic bytes
};

export const STACKS_TESTNET: StacksNetwork = {
  chainId: ChainId.Testnet,
  transactionVersion: TransactionVersion.Testnet,
  peerNetworkId: PeerNetworkId.Testnet,
  magicBytes: 'T2', // todo: comment bytes version of magic bytes
};

export const STACKS_DEVNET: StacksNetwork = {
  ...STACKS_TESTNET,
  magicBytes: 'id', // todo: comment bytes version of magic bytes
};

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
    default:
      throw new Error(`Unknown network name: ${name}`);
  }
}

export function networkFrom(network: StacksNetworkName | StacksNetwork) {
  if (typeof network === 'string') return networkFromName(network);
  return network;
}
