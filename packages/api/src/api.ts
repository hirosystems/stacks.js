import {
  TransactionVersion,
  ChainID,
  StacksNetwork,
  STACKS_MAINNET,
  bytesToHex,
  Hex,
  validateHash256,
  ClarityAbi,
} from '@stacks/common';
import { createFetchFn, FetchFn } from './fetch';
import {
  FeeEstimateResponse,
  FeeEstimation,
  NoEstimateAvailableError,
  TxBroadcastResult,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from './types';

export const HIRO_MAINNET_URL = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_URL = 'https://stacks-node-api.testnet.stacks.co';
export const HIRO_DEVNET_URL = 'http://localhost:3999';

export const BROADCAST_PATH = '/v2/transactions';
export const TRANSFER_FEE_ESTIMATE_PATH = '/v2/fees/transfer';
export const TRANSACTION_FEE_ESTIMATE_PATH = '/v2/fees/transaction';
export const ACCOUNT_PATH = '/v2/accounts';
export const CONTRACT_ABI_PATH = '/v2/contracts/interface';
export const READONLY_FUNCTION_CALL_PATH = '/v2/contracts/call-read';

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

  /**
   * Lookup the nonce for an address from a core node
   * @param address - The Stacks address to look up the next nonce for
   * @return A promise that resolves to a bigint of the next nonce
   */
  getNonce = async (address: string): Promise<bigint> => {
    return getNonce({ address, url: this.url });
  };

  /**
   * Estimate the total transaction fee in microstacks for a Stacks transaction
   * @param payload - The transaction to estimate fees for
   * @param estimatedLength - Optional argument that provides the endpoint with an
   * estimation of the final length (in bytes) of the transaction, including any post-conditions
   * and signatures
   * @return A promise that resolves to an array of {@link FeeEstimate}
   */
  estimateTransaction = async (
    payload: Hex,
    estimatedLength?: number
  ): Promise<[FeeEstimation, FeeEstimation, FeeEstimation]> => {
    return estimateTransaction({ payload, estimatedLength, url: this.url });
  };

  /**
   * Fetch a contract's ABI
   * @param address - The contracts address
   * @param contractName - The contracts name
   * @returns A promise that resolves to a ClarityAbi if the operation succeeds
   */
  getAbi = async (address: string, contractName: string): Promise<ClarityAbi> => {
    return getAbi({ address, contractName, url: this.url });
  };

  // todo: migrate to new api pattern
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

export type ApiBaseParams = {
  /** Optional API/Node base URL, defaults to {@link HIRO_MAINNET_URL} */
  url?: string;
  /** Optional fetch function, defaults to new instance of {@link createFetchFn} */
  fetchFn?: FetchFn;
};

/**
 * Broadcast a serialized transaction to a Stacks node (which will validate and forward to the network).
 * @param opts.tx - A serialized transaction as a hex string
 * @param opts.attachment - Optional attachment encoded as a hex string
 * @returns A Promise that resolves to a {@link TxBroadcastResult} object
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
} & ApiBaseParams): Promise<TxBroadcastResult> {
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

/**
 * Lookup the nonce for an address from a core node
 * @param opts.address - The Stacks address to look up the next nonce for
 * @return A promise that resolves to an integer
 */
export async function getNonce({
  address,
  url = HIRO_MAINNET_URL,
  fetchFn = createFetchFn(),
}: {
  /** The Stacks address to look up the next nonce for */
  address: string;
} & ApiBaseParams): Promise<bigint> {
  const response = await fetchFn(`${url}${ACCOUNT_PATH}/${address}?proof=0`);
  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error fetching nonce. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }
  const responseText = await response.text();
  const result = JSON.parse(responseText) as { nonce: string };
  return BigInt(result.nonce);
}

/**
 * @deprecated Use the new {@link estimateTransaction} function instead.
 *
 * Estimate the total transaction fee in microstacks for a token transfer
 *
 * ⚠ Only sensible for token transfer transactions!
 * @param opts.tx - The token transfer transaction to estimate fees for
 * @return A promise that resolves to number of microstacks per byte
 */
export async function estimateTransfer({
  tx,
  url = HIRO_MAINNET_URL,
  fetchFn = createFetchFn(),
}: {
  /** The token transfer transaction to estimate fees for */
  tx: Hex;
} & ApiBaseParams): Promise<bigint> {
  const response = await fetchFn(`${url}${TRANSFER_FEE_ESTIMATE_PATH}`, {
    headers: {
      Accept: 'application/text',
    },
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error estimating transfer fee. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }
  const feeRateResult = await response.text();
  const txBytes = BigInt(Math.ceil(tx.length / 2));
  const feeRate = BigInt(feeRateResult);
  return feeRate * txBytes;
}

/**
 * Estimate the total transaction fee in microstacks for a Stacks transaction
 * @param opts.payload - The transaction to estimate fees for
 * @param opts.estimatedLength - Optional argument that provides the endpoint with an
 * estimation of the final length (in bytes) of the transaction, including any post-conditions
 * and signatures
 * @return A promise that resolves to FeeEstimate
 */
export async function estimateTransaction({
  payload,
  estimatedLength,
  url = HIRO_MAINNET_URL,
  fetchFn = createFetchFn(),
}: {
  payload: Hex;
  estimatedLength?: number;
} & ApiBaseParams): Promise<[FeeEstimation, FeeEstimation, FeeEstimation]> {
  const json = {
    transaction_payload: payload,
    estimated_len: estimatedLength,
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  };

  const response = await fetchFn(`${url}${TRANSACTION_FEE_ESTIMATE_PATH}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    if (body?.reason === 'NoEstimateAvailable') {
      throw new NoEstimateAvailableError(body?.reason_data?.message ?? '');
    }

    throw new Error(
      `Error estimating transaction fee. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${body}"`
    );
  }

  const data: FeeEstimateResponse = await response.json();
  return data.estimations;
}

/**
 * Fetch a contract's ABI
 * @param opts.address - The contracts address
 * @param opts.contractName - The contracts name
 * @returns A promise that resolves to a ClarityAbi if the operation succeeds
 */
export async function getAbi({
  address,
  contractName,
  url = HIRO_MAINNET_URL,
  fetchFn = createFetchFn(),
}: {
  address: string;
  contractName: string;
} & ApiBaseParams): Promise<ClarityAbi> {
  const response = await fetchFn(`${url}${CONTRACT_ABI_PATH}/${address}/${contractName}`);
  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error fetching contract ABI for contract "${contractName}" at address ${address}. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  return JSON.parse(await response.text()) as ClarityAbi;
}
