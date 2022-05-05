import { TransactionVersion, ChainID, makeFetchFn, FetchFn } from '@stacks/common';
import { HIRO_MAINNET_DEFAULT, HIRO_MOCKNET_DEFAULT, HIRO_TESTNET_DEFAULT } from './api';

export interface NetworkConfig {
  apiUrl: string;
  transactionVersion: TransactionVersion;
  chainId: ChainID;
  // has default value in {makeNetwork}
  fetchFn?: FetchFn;
}

export interface StacksNetwork extends NetworkConfig {
  fetchFn: FetchFn; // mandatory {fetchFn}
}

export const makeNetwork = (networkConfig: NetworkConfig) => ({
  ...networkConfig,
  fetchFn: networkConfig.fetchFn ?? makeFetchFn(),
});

export const StacksMainnet = makeNetwork({
  apiUrl: HIRO_MAINNET_DEFAULT,
  transactionVersion: TransactionVersion.Mainnet,
  chainId: ChainID.Mainnet,
});

export const StacksTestnet = makeNetwork({
  apiUrl: HIRO_TESTNET_DEFAULT,
  transactionVersion: TransactionVersion.Testnet,
  chainId: ChainID.Testnet,
});

export const StacksMocknet = makeNetwork({
  apiUrl: HIRO_MOCKNET_DEFAULT,
  transactionVersion: TransactionVersion.Testnet,
  chainId: ChainID.Testnet,
});

export const isMainnet = (network: StacksNetwork) =>
  network.transactionVersion === TransactionVersion.Mainnet;
