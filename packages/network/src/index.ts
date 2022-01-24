import { TransactionVersion, ChainID, fetchPrivate } from '@stacks/common';

export const HIRO_MAINNET_DEFAULT = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_DEFAULT = 'https://stacks-node-api.testnet.stacks.co';
export const HIRO_MOCKNET_DEFAULT = 'http://localhost:3999';

export interface NetworkConfig {
  url: string;
}

export const StacksNetworks = ['mainnet', 'testnet', 'mocknet'] as const;
export type StacksNetworkName = typeof StacksNetworks[number];

export interface IStacksNetwork {
  version: TransactionVersion;
  chainId: ChainID;
  bnsLookupUrl: string;
  readonly coreApiUrl: string;
  broadcastEndpoint: string;
  transferFeeEstimateEndpoint: string;
  transactionFeeEstimateEndpoint: string;
  accountEndpoint: string;
  contractAbiEndpoint: string;
  readOnlyFunctionCallEndpoint: string;

  isMainnet(): boolean;
  getBroadcastApiUrl: () => string;
  getTransferFeeEstimateApiUrl: () => string;
  getTransactionFeeEstimateApiUrl: () => string;
  getAccountApiUrl: (address: string) => string;
  getAbiApiUrl: (address: string, contract: string) => string;
  getReadOnlyFunctionCallApiUrl: (
    contractAddress: string,
    contractName: string,
    functionName: string
  ) => string;
  getInfoUrl: () => string;
  getBlockTimeInfoUrl: () => string;
  getPoxInfoUrl: () => string;
  getRewardsUrl: (address: string, options?: any) => string;
  getRewardHoldersUrl: (address: string, options?: any) => string;
  getRewardsTotalUrl: (address: string) => string;
  getStackerInfoUrl: (contractAddress: string, contractName: string) => string;

  /**
   * Get WHOIS-like information for a name, including the address that owns it,
   * the block at which it expires, and the zone file anchored to it (if available).
   *
   * This is intended for use in third-party wallets or in DApps that register names.
   * @param fullyQualifiedName the name to query.  Can be on-chain of off-chain.
   * @return a promise that resolves to the WHOIS-like information
   */
  getNameInfo: (fullyQualifiedName: string) => any;
}

export class StacksNetwork implements IStacksNetwork {
  version = TransactionVersion.Mainnet;
  chainId = ChainID.Mainnet;
  bnsLookupUrl = 'https://stacks-node-api.mainnet.stacks.co';
  broadcastEndpoint = '/v2/transactions';
  transferFeeEstimateEndpoint = '/v2/fees/transfer';
  transactionFeeEstimateEndpoint = '/v2/fees/transaction';
  accountEndpoint = '/v2/accounts';
  contractAbiEndpoint = '/v2/contracts/interface';
  readOnlyFunctionCallEndpoint = '/v2/contracts/call-read';

  readonly coreApiUrl: string;

  constructor(networkConfig: NetworkConfig) {
    this.coreApiUrl = networkConfig.url;
  }

  static fromStacksNetworkName = (networkName: StacksNetworkName): IStacksNetwork => {
    switch (networkName) {
      case 'mainnet':
        return new StacksMainnet();
      case 'testnet':
        return new StacksTestnet();
      case 'mocknet':
        return new StacksMocknet();
      default:
        throw new Error(
          `Invalid network name provided. Must be one of the following: ${StacksNetworks.join(
            ', '
          )}`
        );
    }
  };

  ts = () => new StacksMocknet();
  isMainnet = () => this.version === TransactionVersion.Mainnet;
  getBroadcastApiUrl = () => `${this.coreApiUrl}${this.broadcastEndpoint}`;
  getTransferFeeEstimateApiUrl = () => `${this.coreApiUrl}${this.transferFeeEstimateEndpoint}`;
  getTransactionFeeEstimateApiUrl = () =>
    `${this.coreApiUrl}${this.transactionFeeEstimateEndpoint}`;
  getAccountApiUrl = (address: string) =>
    `${this.coreApiUrl}${this.accountEndpoint}/${address}?proof=0`;
  getAbiApiUrl = (address: string, contract: string) =>
    `${this.coreApiUrl}${this.contractAbiEndpoint}/${address}/${contract}`;
  getReadOnlyFunctionCallApiUrl = (
    contractAddress: string,
    contractName: string,
    functionName: string
  ) =>
    `${this.coreApiUrl}${
      this.readOnlyFunctionCallEndpoint
    }/${contractAddress}/${contractName}/${encodeURIComponent(functionName)}`;
  getInfoUrl = () => `${this.coreApiUrl}/v2/info`;
  getBlockTimeInfoUrl = () => `${this.coreApiUrl}/extended/v1/info/network_block_times`;
  getPoxInfoUrl = () => `${this.coreApiUrl}/v2/pox`;
  getRewardsUrl = (address: string, options?: any) => {
    let url = `${this.coreApiUrl}/extended/v1/burnchain/rewards/${address}`;
    if (options) {
      url = `${url}?limit=${options.limit}&offset=${options.offset}`;
    }
    return url;
  };
  getRewardsTotalUrl = (address: string) =>
    `${this.coreApiUrl}/extended/v1/burnchain/rewards/${address}/total`;
  getRewardHoldersUrl = (address: string, options?: any) => {
    let url = `${this.coreApiUrl}/extended/v1/burnchain/reward_slot_holders/${address}`;
    if (options) {
      url = `${url}?limit=${options.limit}&offset=${options.offset}`;
    }
    return url;
  };
  getStackerInfoUrl = (contractAddress: string, contractName: string) =>
    `${this.coreApiUrl}${this.readOnlyFunctionCallEndpoint}
    ${contractAddress}/${contractName}/get-stacker-info`;
  getNameInfo(fullyQualifiedName: string) {
    /*
      TODO: Update to v2 API URL for name lookups
    */
    const nameLookupURL = `${this.bnsLookupUrl}/v1/names/${fullyQualifiedName}`;
    return fetchPrivate(nameLookupURL)
      .then(resp => {
        if (resp.status === 404) {
          throw new Error('Name not found');
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`);
        } else {
          return resp.json();
        }
      })
      .then(nameInfo => {
        // the returned address _should_ be in the correct network ---
        //  blockstackd gets into trouble because it tries to coerce back to mainnet
        //  and the regtest transaction generation libraries want to use testnet addresses
        if (nameInfo.address) {
          return Object.assign({}, nameInfo, { address: nameInfo.address });
        } else {
          return nameInfo;
        }
      });
  }
}

export class StacksMainnet extends StacksNetwork implements IStacksNetwork {
  version = TransactionVersion.Mainnet;
  chainId = ChainID.Mainnet;

  constructor(networkUrl: NetworkConfig = { url: HIRO_MAINNET_DEFAULT }) {
    super(networkUrl);
  }
}

export class StacksTestnet extends StacksNetwork implements IStacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;

  constructor(networkUrl: NetworkConfig = { url: HIRO_TESTNET_DEFAULT }) {
    super(networkUrl);
  }
}

export class StacksMocknet extends StacksNetwork implements IStacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;

  constructor(networkUrl: NetworkConfig = { url: HIRO_MOCKNET_DEFAULT }) {
    super(networkUrl);
  }
}
