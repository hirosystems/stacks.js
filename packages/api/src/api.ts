import {
  TransactionVersion,
  ChainID,
  StacksNetwork,
  STACKS_MAINNET,
  bytesToHex,
  Hex,
  validateHash256,
} from '@stacks/common';
import { createFetchFn, FetchFn } from './fetch';
import { TxBroadcastResult, TxBroadcastResultOk, TxBroadcastResultRejected } from './types';

export const HIRO_MAINNET_URL = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_URL = 'https://stacks-node-api.testnet.stacks.co';
export const HIRO_DEVNET_URL = 'http://localhost:3999';

export const BROADCAST_PATH = '/v2/transactions';
export const TRANSFER_FEE_ESTIMATE_PATH = '/v2/fees/transfer';
export const TRANSACTION_FEE_ESTIMATE_PATH = '/v2/fees/transaction';
export const ACCOUNT_PATH = '/v2/accounts';
export const CONTRACT_ABI_PATH = '/v2/contracts/interface';
export const READONLY_FUNCTION_CALL_PATH = '/v2/contracts/call-read';

/** @ignore internal */
export const StacksNetworks = ['mainnet', 'testnet', 'devnet', 'mocknet'] as const;
/** The enum-style names of different common Stacks networks */
export type StacksNetworkName = (typeof StacksNetworks)[number];

/**
 * todo
 */
export class StacksApi {
  // URLS TODO
  bnsLookupUrl = 'https://stacks-node-api.mainnet.stacks.co';

  url: string;
  fetchFn: FetchFn;
  network: StacksNetwork;

  constructor({
    url,
    fetchFn,
    network = STACKS_MAINNET,
  }: {
    /** The base API/node URL for the network fetch calls */
    url?: string;
    /** An optional custom fetch function to override default behaviors */
    fetchFn?: FetchFn;
    /** Stacks network object (defaults to {@link STACKS_MAINNET}) */
    network?: StacksNetwork;
  }) {
    this.url = url
      ? url // use the URL if given
      : !network || network.transactionVersion === TransactionVersion.Mainnet
      ? HIRO_MAINNET_URL // default to mainnet if no network is given
      : network.transactionVersion === TransactionVersion.Testnet
      ? HIRO_TESTNET_URL
      : HIRO_DEVNET_URL;
    this.fetchFn = fetchFn ?? createFetchFn();
    this.network = network;
  }

  /** Returns `true` if the network is configured to 'mainnet', based on the TransactionVersion */
  isMainnet = () => this.network.transactionVersion === TransactionVersion.Mainnet;

  /**
   * Broadcast a serialized transaction to a Stacks node (which will validate and forward to the network).
   * @param tx
   * @param attachment
   * @returns a Promise that resolves to a {@link TxBroadcastResult} object
   */
  broadcastTransaction = async (
    tx: Uint8Array | string,
    attachment?: Uint8Array | string
  ): Promise<TxBroadcastResult> => {
    // todo: should we use a opts object instead of positional args here?
    // todo: allow tx object as well (.serialize())
    if (typeof tx !== 'string') tx = bytesToHex(tx);
    if (attachment && typeof attachment !== 'string') attachment = bytesToHex(attachment);

    return broadcastTransaction({ tx, attachment, url: this.url });
  };

  getBroadcastApiUrl = () => `${this.url}${this.broadcastEndpoint}`;
  getTransferFeeEstimateApiUrl = () => `${this.url}${this.transferFeeEstimateEndpoint}`;
  getTransactionFeeEstimateApiUrl = () => `${this.url}${this.transactionFeeEstimateEndpoint}`;
  getAccountApiUrl = (address: string) => `${this.url}${this.accountEndpoint}/${address}?proof=0`;
  getAccountExtendedBalancesApiUrl = (address: string) =>
    `${this.url}/extended/v1/address/${address}/balances`;
  getAbiApiUrl = (address: string, contract: string) =>
    `${this.url}${this.contractAbiEndpoint}/${address}/${contract}`;
  getReadOnlyFunctionCallApiUrl = (
    contractAddress: string,
    contractName: string,
    functionName: string
  ) =>
    `${this.url}${
      this.readOnlyFunctionCallEndpoint
    }/${contractAddress}/${contractName}/${encodeURIComponent(functionName)}`;
  getInfoUrl = () => `${this.url}/v2/info`;
  getBlockTimeInfoUrl = () => `${this.url}/extended/v1/info/network_block_times`;
  getPoxInfoUrl = () => `${this.url}/v2/pox`;
  getRewardsUrl = (address: string, options?: any) => {
    let url = `${this.url}/extended/v1/burnchain/rewards/${address}`;
    if (options) {
      url = `${url}?limit=${options.limit}&offset=${options.offset}`;
    }
    return url;
  };
  getRewardsTotalUrl = (address: string) =>
    `${this.url}/extended/v1/burnchain/rewards/${address}/total`;
  getRewardHoldersUrl = (address: string, options?: any) => {
    let url = `${this.url}/extended/v1/burnchain/reward_slot_holders/${address}`;
    if (options) {
      url = `${url}?limit=${options.limit}&offset=${options.offset}`;
    }
    return url;
  };
  getStackerInfoUrl = (contractAddress: string, contractName: string) =>
    `${this.url}${this.readOnlyFunctionCallEndpoint}
    ${contractAddress}/${contractName}/get-stacker-info`;
  getDataVarUrl = (contractAddress: string, contractName: string, dataVarName: string) =>
    `${this.url}/v2/data_var/${contractAddress}/${contractName}/${dataVarName}?proof=0`;
  getMapEntryUrl = (contractAddress: string, contractName: string, mapName: string) =>
    `${this.url}/v2/map_entry/${contractAddress}/${contractName}/${mapName}?proof=0`;
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
 * Broadcast a serialized transaction to a Stacks node (which will validate and forward to the network).
 * @returns a Promise that resolves to a {@link TxBroadcastResult} object
 */
async function broadcastTransaction({
  tx,
  attachment,
  url = HIRO_MAINNET_URL,
  fetchFn = createFetchFn(),
}: {
  /** A serialized transaction as a hex string */
  tx: Hex;
  /** Optional attachment encoded as a hex string */
  attachment?: Hex;
  /** Optional API/Node base URL, defaults to {@link HIRO_MAINNET_URL} */
  url?: string;
  /** Optional fetch function, defaults to new instance of {@link createFetchFn} */
  fetchFn?: FetchFn;
}): Promise<TxBroadcastResult> {
  const json = attachment ? { tx, attachment } : { tx };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  };

  const response = await fetchFn(`${url}${BROADCAST_PATH}`, options);
  if (!response.ok) {
    try {
      return (await response.json()) as TxBroadcastResultRejected;
    } catch (e) {
      throw Error('Failed to broadcast transaction (unable to parse node response).', { cause: e });
    }
  }

  const text = await response.text();
  const txid = text.replace(/["]+/g, ''); // Replace extra quotes around txid string
  if (!validateHash256(txid)) throw new Error(text);

  return { txid } as TxBroadcastResultOk;
}
