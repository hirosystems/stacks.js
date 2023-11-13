import { ClarityAbi, bytesToHex, validateHash256, with0x } from '@stacks/common';
import { deriveDefaultUrl } from './api';
import { estimateTransactionByteLength } from './builders';
import { ClarityValue, NoneCV, deserializeCV, serializeCV } from './clarity';
import { NoEstimateAvailableError } from './errors';
import { serializePayload } from './payload';
import { StacksTransaction, deriveNetwork } from './transaction';
import {
  FeeEstimateResponse,
  FeeEstimation,
  TxBroadcastResult,
  TxBroadcastResultOk,
  TxBroadcastResultRejected,
} from './types';
import { cvToHex, parseReadOnlyResponse } from './utils';

export const HIRO_MAINNET_URL = 'https://stacks-node-api.mainnet.stacks.co';
export const HIRO_TESTNET_URL = 'https://stacks-node-api.testnet.stacks.co';
export const DEVNET_URL = 'http://localhost:3999';

export const BROADCAST_PATH = '/v2/transactions';
export const TRANSFER_FEE_ESTIMATE_PATH = '/v2/fees/transfer';
export const TRANSACTION_FEE_ESTIMATE_PATH = '/v2/fees/transaction';
export const ACCOUNT_PATH = '/v2/accounts';
export const CONTRACT_ABI_PATH = '/v2/contracts/interface';
export const READONLY_FUNCTION_CALL_PATH = '/v2/contracts/call-read';
export const MAP_ENTRY_PATH = '/v2/map_entry';

export type ApiParam = {
  /** Optional API object (for `.url` and `.fetch`) used for API/Node, defaults to use mainnet */
  api?: {
    url: string;
    fetch: FetchFn;
  };
};

/** Creates a API-like object, which can be used without circular dependencies @ignore */
function defaultApiLike() {
  return {
    // todo: do we want network here as well?
    url: HIRO_MAINNET_URL,
    fetch: createFetchFn(),
  };
}

/**
 * Broadcast a serialized transaction to a Stacks node (which will validate and forward to the network).
 * @param opts.transaction - The transaction to broadcast
 * @param opts.attachment - Optional attachment encoded as a hex string
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @returns A Promise that resolves to a {@link TxBroadcastResult} object
 */
export async function broadcastTransaction({
  transaction: txOpt,
  attachment: attachOpt,
  api: apiOpt,
}: {
  /** The transaction to broadcast */
  transaction: StacksTransaction;
  /** Optional attachment in bytes or encoded as a hex string */
  attachment?: Uint8Array | string;
} & ApiParam): Promise<TxBroadcastResult> {
  const tx = bytesToHex(txOpt.serialize());
  const attachment = attachOpt
    ? typeof attachOpt === 'string'
      ? attachOpt
      : bytesToHex(attachOpt)
    : undefined;
  const json = attachOpt ? { tx, attachment } : { tx };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  };

  const api = apiOpt ?? {
    url: deriveDefaultUrl(deriveNetwork(txOpt)),
    fetch: createFetchFn(),
  };
  const url = `${api.url}${BROADCAST_PATH}`;
  const response = await api.fetch(url, options);

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
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @return A promise that resolves to an integer
 */
export async function getNonce({
  address,
  api: apiOpt,
}: {
  /** The Stacks address to look up the next nonce for */
  address: string;
} & ApiParam): Promise<bigint> {
  // todo: could derive the network from the address and use as default if no apiOd

  const api = apiOpt ?? defaultApiLike();
  const url = `${api.url}${ACCOUNT_PATH}/${address}?proof=0`;
  const response = await api.fetch(url);

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error fetching nonce. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  const json = (await response.json()) as { nonce: string };
  return BigInt(json.nonce);
}

/**
 * @deprecated Use the new {@link estimateTransaction} function instead.
 *
 * Estimate the total transaction fee in microstacks for a token transfer
 *
 * ⚠ Only sensible for token transfer transactions!
 * @param opts.transaction - The token transfer transaction to estimate fees for
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @return A promise that resolves to number of microstacks per byte
 */
export async function estimateTransfer({
  transaction: txOpt,
  api: apiOpt,
}: {
  /** The token transfer transaction to estimate fees for */
  transaction: StacksTransaction;
} & ApiParam): Promise<bigint> {
  const api = apiOpt ?? {
    url: deriveDefaultUrl(deriveNetwork(txOpt)),
    fetch: createFetchFn(),
  };
  const url = `${api.url}${TRANSFER_FEE_ESTIMATE_PATH}`;
  const response = await api.fetch(url, {
    headers: { Accept: 'application/text' },
  });

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error estimating transfer fee. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  const feeRateResult = await response.text();
  const txBytes = BigInt(Math.ceil(txOpt.serialize().byteLength));
  const feeRate = BigInt(feeRateResult);
  return feeRate * txBytes;
}

/**
 * Estimate the total transaction fee in microstacks for a Stacks transaction
 * @param opts.payload - The transaction to estimate fees for
 * @param opts.estimatedLength - Optional estimation of the final length (in
 * bytes) of the transaction, including any post-conditions and signatures
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @return A promise that resolves to FeeEstimate
 */
export async function estimateTransaction({
  payload,
  estimatedLength,
  api: apiOpt,
}: {
  payload: string;
  estimatedLength?: number;
} & ApiParam): Promise<[FeeEstimation, FeeEstimation, FeeEstimation]> {
  const json = {
    transaction_payload: payload,
    estimated_len: estimatedLength,
  };
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  };

  const api = apiOpt ?? defaultApiLike();
  const url = `${api.url}${TRANSACTION_FEE_ESTIMATE_PATH}`;
  const response = await api.fetch(url, options);

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
 * Estimates the fee using {@link estimateTransaction}, but retries to estimate
 * with {@link estimateTransfer} as a fallback if does not get an estimation due
 * to the {@link NoEstimateAvailableError} error.
 * @param opts.transaction - The transaction to estimate fees for
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 */
export async function estimateFee({
  transaction: txOpt,
  api: apiOpt,
}: {
  transaction: StacksTransaction;
} & ApiParam): Promise<bigint | number> {
  const api = apiOpt ?? {
    url: deriveDefaultUrl(deriveNetwork(txOpt)),
    fetch: createFetchFn(),
  };

  try {
    const estimatedLength = estimateTransactionByteLength(txOpt);
    return (
      await estimateTransaction({
        payload: bytesToHex(serializePayload(txOpt.payload)),
        estimatedLength,
        api,
      })
    )[1].fee;
  } catch (error) {
    if (!(error instanceof NoEstimateAvailableError)) throw error;
    return await estimateTransfer({ transaction: txOpt, api });
  }
}

/**
 * Fetch a contract's ABI
 * @param opts.address - The contracts address
 * @param opts.contractName - The contracts name
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @returns A promise that resolves to a ClarityAbi if the operation succeeds
 */
export async function getAbi({
  contractAddress: address,
  contractName: name,
  api: apiOpt,
}: {
  contractAddress: string;
  contractName: string;
} & ApiParam): Promise<ClarityAbi> {
  const api = apiOpt ?? defaultApiLike();
  const url = `${api.url}${CONTRACT_ABI_PATH}/${address}/${name}`;
  const response = await api.fetch(url);

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error fetching contract ABI for contract "${name}" at address ${address}. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  return (await response.json()) as ClarityAbi;
}

/**
 * Calls a function as read-only from a contract interface.
 * It is not necessary that the function is defined as read-only in the contract
 * @param opts.contractName - The contract name
 * @param opts.contractAddress - The contract address
 * @param opts.functionName - The contract function name
 * @param opts.functionArgs - The contract function arguments
 * @param opts.senderAddress - The address of the (simulated) sender
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @return Returns an object with a status bool (okay) and a result string that
 * is a serialized clarity value in hex format.
 */
export async function callReadOnlyFunction({
  contractName,
  contractAddress,
  functionName,
  functionArgs,
  senderAddress,
  api: apiOpt,
}: {
  contractName: string;
  contractAddress: string;
  functionName: string;
  functionArgs: ClarityValue[];
  /** address of the sender */
  senderAddress: string;
} & ApiParam): Promise<ClarityValue> {
  const json = {
    sender: senderAddress,
    arguments: functionArgs.map(arg => cvToHex(arg)),
  };
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  };

  const name = encodeURIComponent(functionName);

  const api = apiOpt ?? defaultApiLike();
  const url = `${api.url}${READONLY_FUNCTION_CALL_PATH}/${contractAddress}/${contractName}/${name}`;
  const response = await api.fetch(url, options);

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error calling read-only function. Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  return await response.json().then(parseReadOnlyResponse);
}

/**
 * Fetch data from a contract data map.
 * @param opts.contractAddress - The contract address
 * @param opts.contractName - The contract name
 * @param opts.mapName - The map variable name
 * @param opts.mapKey - The key of the map entry to look up
 * @param opts.api - Optional API info (`.url` & `.fetch`) used for fetch call
 * @returns Promise that resolves to a ClarityValue if the operation succeeds.
 * Resolves to NoneCV if the map does not contain the given key, if the map does not exist, or if the contract prinicipal does not exist
 */
export async function getContractMapEntry<T extends ClarityValue = ClarityValue>({
  contractAddress,
  contractName,
  mapName,
  mapKey,
  api: apiOpt,
}: {
  contractAddress: string;
  contractName: string;
  mapName: string;
  mapKey: ClarityValue;
} & ApiParam): Promise<T | NoneCV> {
  const keyHex = with0x(bytesToHex(serializeCV(mapKey)));

  const options = {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(keyHex), // endpoint expects a JSON string atom (quote wrapped string)
  };

  const api = apiOpt ?? defaultApiLike();
  const url = `${api.url}${MAP_ENTRY_PATH}/${contractAddress}/${contractName}/${mapName}?proof=0`;
  const response = await api.fetch(url, options);

  if (!response.ok) {
    const msg = await response.text().catch(() => '');
    throw new Error(
      `Error fetching map entry for map "${mapName}" in contract "${contractName}" at address ${contractAddress}, using map key "${keyHex}". Response ${response.status}: ${response.statusText}. Attempted to fetch ${url} and failed with the message: "${msg}"`
    );
  }

  const json: { data?: string } = await response.json();
  if (!json.data) {
    throw new Error(
      `Error fetching map entry for map "${mapName}" in contract "${contractName}" at address ${contractAddress}, using map key "${keyHex}". Response ${
        response.status
      }: ${response.statusText}. Attempted to fetch ${
        api.url
      } and failed with the response: "${JSON.stringify(json)}"`
    );
  }

  try {
    return deserializeCV<T>(json.data);
  } catch (error) {
    throw new Error(`Error deserializing Clarity value "${json.data}": ${error}`);
  }
}

import 'cross-fetch/polyfill';

// Define a default request options and allow modification using getters, setters
// Reference: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
const defaultFetchOpts: RequestInit = {
  // By default referrer value will be client:origin: above reference link
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy
  referrerPolicy: 'origin', // Use origin value for referrer policy
  headers: {
    'x-hiro-product': 'stacksjs',
  },
};

/**
 * Get fetch options
 * @category Network
 */
export const getFetchOptions = () => {
  return defaultFetchOpts;
};

/**
 * Sets global fetch options for stacks.js network calls.
 *
 * @example
 * Users can change the default referrer as well as other options when fetch is used internally by stacks.js:
 * ```
 * setFetchOptions({ referrer: 'no-referrer', referrerPolicy: 'no-referrer', ...otherRequestOptions });
 * ```
 * After calling {@link setFetchOptions} all subsequent network calls will use the specified options above.
 *
 * @see MDN Request: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
 * @returns global fetch options after merging with previous options (or defaults)
 * @category Network
 * @related {@link getFetchOptions}
 */
export const setFetchOptions = (ops: RequestInit): RequestInit => {
  return Object.assign(defaultFetchOpts, ops);
};

/** @internal */
export async function fetchWrapper(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const fetchOpts = {};
  // Use the provided options in request options along with default or user provided values
  Object.assign(fetchOpts, defaultFetchOpts, init);

  const fetchResult = await fetch(input, fetchOpts);
  return fetchResult;
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export interface RequestContext {
  fetch: FetchFn;
  url: string;
  init: RequestInit;
}

export interface ResponseContext {
  fetch: FetchFn;
  url: string;
  init: RequestInit;
  response: Response;
}

export interface FetchParams {
  url: string;
  init: RequestInit;
}

export interface FetchMiddleware {
  pre?: (context: RequestContext) => PromiseLike<FetchParams | void> | FetchParams | void;
  post?: (context: ResponseContext) => Promise<Response | void> | Response | void;
}
export interface ApiKeyMiddlewareOpts {
  /** The middleware / API key header will only be added to requests matching this host. */
  host?: RegExp | string;
  /** The http header name used for specifying the API key value. */
  httpHeader?: string;
  /** The API key string to specify as an http header value. */
  apiKey: string;
}

/** @internal */
export function hostMatches(host: string, pattern: string | RegExp) {
  if (typeof pattern === 'string') return pattern === host;
  return pattern.exec(host);
}

/**
 * Creates a new middleware from an API key.
 * @example
 * ```
 * const apiMiddleware = createApiKeyMiddleware("example_e8e044a3_41d8b0fe_3dd3988ef302");
 * const fetchFn = createFetchFn(apiMiddleware);
 * const network = new StacksMainnet({ fetchFn });
 * ```
 * @category Network
 * @related {@link createFetchFn}, {@link StacksNetwork}
 */
export function createApiKeyMiddleware({
  apiKey,
  host = /(.*)api(.*)\.stacks\.co$/i,
  httpHeader = 'x-api-key',
}: ApiKeyMiddlewareOpts): FetchMiddleware {
  return {
    pre: context => {
      const reqUrl = new URL(context.url);
      if (!hostMatches(reqUrl.host, host)) return; // Skip middleware if host does not match pattern

      const headers = new Headers(context.init.headers);
      headers.set(httpHeader, apiKey);
      context.init.headers = headers;
    },
  };
}

function argsForCreateFetchFn(args: any[]): { fetchLib: FetchFn; middlewares: FetchMiddleware[] } {
  let fetchLib: FetchFn = fetchWrapper;
  let middlewares: FetchMiddleware[] = [];
  if (args.length > 0 && typeof args[0] === 'function') {
    fetchLib = args.shift();
  }
  if (args.length > 0) {
    middlewares = args; // remaining args
  }
  return { fetchLib, middlewares };
}

/**
 * Creates a new network fetching function, which combines an optional fetch-compatible library with optional middlware.
 * @example
 * ```
 * const customFetch = createFetchFn(someMiddleware)
 * const customFetch = createFetchFn(fetch, someMiddleware)
 * const customFetch = createFetchFn(fetch, middlewareA, middlewareB)
 * ```
 * @category Network
 */
export function createFetchFn(fetchLib: FetchFn, ...middleware: FetchMiddleware[]): FetchFn;
export function createFetchFn(...middleware: FetchMiddleware[]): FetchFn;
export function createFetchFn(...args: any[]): FetchFn {
  const { fetchLib, middlewares } = argsForCreateFetchFn(args);

  const fetchFn = async (url: string, init?: RequestInit | undefined): Promise<Response> => {
    let fetchParams = { url, init: init ?? {} };

    for (const middleware of middlewares) {
      if (typeof middleware.pre === 'function') {
        const result = await Promise.resolve(
          middleware.pre({
            fetch: fetchLib,
            ...fetchParams,
          })
        );
        fetchParams = result ?? fetchParams;
      }
    }

    let response = await fetchLib(fetchParams.url, fetchParams.init);

    for (const middleware of middlewares) {
      if (typeof middleware.post === 'function') {
        const result = await Promise.resolve(
          middleware.post({
            fetch: fetchLib,
            url: fetchParams.url,
            init: fetchParams.init,
            response: response?.clone() ?? response,
          })
        );
        response = result ?? response;
      }
    }
    return response;
  };
  return fetchFn;
}
