import { TransactionVersion, ChainID, fetchPrivate } from '@stacks/common';

export interface StacksNetwork {
  version: TransactionVersion;
  chainId: ChainID;
  coreApiUrl: string;
  broadcastEndpoint: string;
  transferFeeEstimateEndpoint: string;
  accountEndpoint: string;
  contractAbiEndpoint: string;
  readOnlyFunctionCallEndpoint: string;
  isMainnet(): boolean;
  getBroadcastApiUrl: () => string;
  getTransferFeeEstimateApiUrl: () => string;
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

export class StacksMainnet implements StacksNetwork {
  version = TransactionVersion.Mainnet;
  chainId = ChainID.Mainnet;
  coreApiUrl = 'https://core.blockstack.org';
  broadcastEndpoint = '/v2/transactions';
  transferFeeEstimateEndpoint = '/v2/fees/transfer';
  accountEndpoint = '/v2/accounts';
  contractAbiEndpoint = '/v2/contracts/interface';
  readOnlyFunctionCallEndpoint = '/v2/contracts/call-read';

  isMainnet = () => this.version === TransactionVersion.Mainnet;
  getBroadcastApiUrl = () => `${this.coreApiUrl}${this.broadcastEndpoint}`;
  getTransferFeeEstimateApiUrl = () => `${this.coreApiUrl}${this.transferFeeEstimateEndpoint}`;
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
  getStackerInfoUrl = (contractAddress: string, contractName: string) =>
    `${this.coreApiUrl}${this.readOnlyFunctionCallEndpoint}
    ${contractAddress}/${contractName}/get-stacker-info`;
  getNameInfo(fullyQualifiedName: string) {
    /*
      TODO: Update to v2 API URL for name lookups
    */
    const nameLookupURL = `${this.coreApiUrl}/v1/names/${fullyQualifiedName}`;
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

export class StacksTestnet extends StacksMainnet implements StacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;
  coreApiUrl = 'https://stacks-node-api.blockstack.org';
}

export class StacksMocknet extends StacksMainnet implements StacksNetwork {
  version = TransactionVersion.Testnet;
  chainId = ChainID.Testnet;
  coreApiUrl = 'http://localhost:3999';
}
