import { TransactionVersion, ChainID } from '@stacks/common';
import { createFetchFn, FetchFn } from './fetch';

export const HIRO_MAINNET_DEFAULT = 'https://api.mainnet.hiro.so';
export const HIRO_TESTNET_DEFAULT = 'https://api.testnet.hiro.so';
export const HIRO_MOCKNET_DEFAULT = 'http://localhost:3999';

/**
 * Used for constructing Network instances
 * @related {@link StacksNetwork}, {@link StacksMainnet}, {@link StacksTestnet}, {@link StacksDevnet}, {@link StacksMocknet}
 */
export interface NetworkConfig {
  /** The base API/node URL for the network fetch calls */
  url: string;
  /** An optional custom fetch function to override default behaviors */
  fetchFn?: FetchFn;
}

/** @ignore internal */
export const StacksNetworks = ['mainnet', 'testnet', 'devnet', 'mocknet'] as const;
/** The enum-style names of different common Stacks networks */
export type StacksNetworkName = (typeof StacksNetworks)[number];

/**
 * The base class for Stacks networks. Typically used via its subclasses.
 * @related {@link StacksMainnet}, {@link StacksTestnet}, {@link StacksDevnet}, {@link StacksMocknet}
 */
export class StacksNetwork {
  version: TransactionVersion = TransactionVersion.Mainnet;
  chainId: ChainID = ChainID.Mainnet;
  bnsLookupUrl = 'https://api.mainnet.hiro.so';
  broadcastEndpoint = '/v2/transactions';
  transferFeeEstimateEndpoint = '/v2/fees/transfer';
  transactionFeeEstimateEndpoint = '/v2/fees/transaction';
  accountEndpoint = '/v2/accounts';
  contractAbiEndpoint = '/v2/contracts/interface';
  readOnlyFunctionCallEndpoint = '/v2/contracts/call-read';

  readonly coreApiUrl: string;

  fetchFn: FetchFn;

  constructor(networkConfig: NetworkConfig) {
    this.coreApiUrl = networkConfig.url;
    this.fetchFn = networkConfig.fetchFn ?? createFetchFn();
  }

  /** A static network constructor from a network name */
  static fromName = (networkName: StacksNetworkName): StacksNetwork => {
    switch (networkName) {
      case 'mainnet':
        return new StacksMainnet();
      case 'testnet':
        return new StacksTestnet();
      case 'devnet':
        return new StacksDevnet();
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

  /** @ignore internal */
  static fromNameOrNetwork = (network: StacksNetworkName | StacksNetwork) => {
    if (typeof network !== 'string' && 'version' in network) {
      return network;
    }

    return StacksNetwork.fromName(network);
  };

  /** Returns `true` if the network is configured to 'mainnet', based on the TransactionVersion */
  isMainnet = () => this.version === TransactionVersion.Mainnet;
  getBroadcastApiUrl = () => `${this.coreApiUrl}${this.broadcastEndpoint}`;
  getTransferFeeEstimateApiUrl = () => `${this.coreApiUrl}${this.transferFeeEstimateEndpoint}`;
  getTransactionFeeEstimateApiUrl = () =>
    `${this.coreApiUrl}${this.transactionFeeEstimateEndpoint}`;
  getAccountApiUrl = (address: string) =>
    `${this.coreApiUrl}${this.accountEndpoint}/${address}?proof=0`;
  getAccountExtendedBalancesApiUrl = (address: string) =>
    `${this.coreApiUrl}/extended/v1/address/${address}/balances`;
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
  getDataVarUrl = (contractAddress: string, contractName: string, dataVarName: string) =>
    `${this.coreApiUrl}/v2/data_var/${contractAddress}/${contractName}/${dataVarName}?proof=0`;
  getMapEntryUrl = (contractAddress: string, contractName: string, mapName: string) =>
    `${this.coreApiUrl}/v2/map_entry/${contractAddress}/${contractName}/${mapName}?proof=0`;
  getNameInfo(fullyQualifiedName: string) {
    /*
      TODO: Update to v2 API URL for name lookups
    */
    const nameLookupURL = `${this.bnsLookupUrl}/v1/names/${fullyQualifiedName}`;
    return this.fetchFn(nameLookupURL)
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
        //  stacks node gets into trouble because it tries to coerce back to mainnet
        //  and the regtest transaction generation libraries want to use testnet addresses
        if (nameInfo.address) {
          return Object.assign({}, nameInfo, { address: nameInfo.address });
        } else {
          return nameInfo;
        }
      });
  }
}

/**
 * A {@link StacksNetwork} with the parameters for the Stacks mainnet.
 * Pass a `url` option to override the default Hiro hosted Stacks node API.
 * Pass a `fetchFn` option to customize the default networking functions.
 * @example
 * ```
 * const network = new StacksMainnet();
 * const network = new StacksMainnet({ url: "https://api.mainnet.hiro.so" });
 * const network = new StacksMainnet({ fetch: createFetchFn() });
 * ```
 * @related {@link createFetchFn}, {@link createApiKeyMiddleware}
 */
export class StacksMainnet extends StacksNetwork {
  version = TransactionVersion.Mainnet;
  chainId = ChainID.Mainnet;

  constructor(opts?: Partial<NetworkConfig>) {
    super({
      url: opts?.url ?? HIRO_MAINNET_DEFAULT,
      fetchFn: opts?.fetchFn,
    });
  }
}

/**
 * A {@link StacksNetwork} with the parameters for the Stacks testnet.
 * Pass a `url` option to override the default Hiro hosted Stacks node API.
 * Pass a `fetchFn` option to customize the default networking functions.
 * @example
 * ```
 * const network = new StacksTestnet();
 * const network = new StacksTestnet({ url: "https://api.testnet.hiro.so" });
 * const network = new StacksTestnet({ fetch: createFetchFn() });
 * ```
 * @related {@link createFetchFn}, {@link createApiKeyMiddleware}
 */
export class StacksTestnet extends StacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;

  constructor(opts?: Partial<NetworkConfig>) {
    super({
      url: opts?.url ?? HIRO_TESTNET_DEFAULT,
      fetchFn: opts?.fetchFn,
    });
  }
}

/**
 * A {@link StacksNetwork} using the testnet parameters, but `localhost:3999` as the API URL.
 */
export class StacksMocknet extends StacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;

  constructor(opts?: Partial<NetworkConfig>) {
    super({
      url: opts?.url ?? HIRO_MOCKNET_DEFAULT,
      fetchFn: opts?.fetchFn,
    });
  }
}

/** Alias for {@link StacksMocknet} */
export const StacksDevnet = StacksMocknet;
