import { StacksNetwork } from '.';

export const HIRO_MAINNET_DEFAULT = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_DEFAULT = 'https://stacks-node-api.testnet.stacks.co';
export const HIRO_MOCKNET_DEFAULT = 'http://localhost:3999';

export const BROADCAST_ENDPOINT = '/v2/transactions';
export const TRANSFER_FEE_ESTIMATE_ENDPOINT = '/v2/fees/transfer';
export const TRANSACTION_FEE_ESTIMATE_ENDPOINT = '/v2/fees/transaction';
export const ACCOUNT_ENDPOINT = '/v2/accounts';
export const CONTRACT_ABI_ENDPOINT = '/v2/contracts/interface';
export const READ_ONLY_FUNCTION_CALL_ENDPOINT = '/v2/contracts/call-read';

export const getBroadcastApiUrl = (network: StacksNetwork) =>
  `${network.apiUrl}${BROADCAST_ENDPOINT}`;

export const getTransferFeeEstimateApiUrl = (network: StacksNetwork) =>
  `${network.apiUrl}${TRANSFER_FEE_ESTIMATE_ENDPOINT}`;

export const getTransactionFeeEstimateApiUrl = (network: StacksNetwork) =>
  `${network.apiUrl}${TRANSACTION_FEE_ESTIMATE_ENDPOINT}`;

export const getAccountApiUrl = (network: StacksNetwork, address: string) =>
  `${network.apiUrl}${ACCOUNT_ENDPOINT}/${address}?proof=0`;

export const getAbiApiUrl = (network: StacksNetwork, address: string, contract: string) =>
  `${network.apiUrl}${CONTRACT_ABI_ENDPOINT}/${address}/${contract}`;

export const getReadOnlyFunctionCallApiUrl = (
  network: StacksNetwork,
  contractAddress: string,
  contractName: string,
  functionName: string
) =>
  `${
    network.apiUrl
  }${READ_ONLY_FUNCTION_CALL_ENDPOINT}/${contractAddress}/${contractName}/${encodeURIComponent(
    functionName
  )}`;

export const getInfoUrl = (network: StacksNetwork) => `${network.apiUrl}/v2/info`;

export const getBlockTimeInfoUrl = (network: StacksNetwork) =>
  `${network.apiUrl}/extended/v1/info/network_block_times`;

export const getPoxInfoUrl = (network: StacksNetwork) => `${network.apiUrl}/v2/pox`;

export const getRewardsUrl = (network: StacksNetwork, address: string, options?: any) => {
  const url = `${network.apiUrl}/extended/v1/burnchain/rewards/${address}`;
  return paginate(url, options);
};

export const getRewardsTotalUrl = (network: StacksNetwork, address: string) =>
  `${network.apiUrl}/extended/v1/burnchain/rewards/${address}/total`;

export const getRewardHoldersUrl = (network: StacksNetwork, address: string, options?: any) => {
  const url = `${network.apiUrl}/extended/v1/burnchain/reward_slot_holders/${address}`;
  return paginate(url, options);
};

export const getStackerInfoUrl = (
  network: StacksNetwork,
  contractAddress: string,
  contractName: string
) =>
  `${network.apiUrl}${READ_ONLY_FUNCTION_CALL_ENDPOINT}
    ${contractAddress}/${contractName}/get-stacker-info`;

export const getNameInfo = (network: StacksNetwork, fullyQualifiedName: string) => {
  // TODO: Update to v2 API URL for name lookups
  const nameLookupURL = `${network.apiUrl}/v1/names/${fullyQualifiedName}`;
  return network
    .fetchFn(nameLookupURL)
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
};

function paginate(url: string, options?: any) {
  if (!options) {
    return url;
  }
  return `${url}?limit=${options.limit}&offset=${options.offset}`;
}
