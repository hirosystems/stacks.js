import {
  DEVNET_URL,
  FetchFn,
  HIRO_MAINNET_URL,
  HIRO_TESTNET_URL,
  Hex,
  createFetchFn,
} from '@stacks/common';
import {
  ClarityAbi,
  FeeEstimation,
  STACKS_MAINNET,
  StacksNetwork,
  StacksNetworkName,
  StacksTransaction,
  TransactionVersion,
  TxBroadcastResult,
  broadcastTransaction,
  estimateTransaction,
  getAbi,
  getNonce,
  networkFrom,
} from '@stacks/transactions';

export class StacksNodeApi {
  // TODO
  bnsLookupUrl = 'https://stacks-node-api.mainnet.stacks.co';

  public url: string;
  public fetch: FetchFn;

  public network: StacksNetwork;

  constructor({
    url,
    fetch,
    network = STACKS_MAINNET,
  }: {
    /** The base API/node URL for the network fetch calls */
    url?: string;
    /** Stacks network object (defaults to {@link STACKS_MAINNET}) */
    network?: StacksNetworkName | StacksNetwork;
    /** An optional custom fetch function to override default behaviors */
    fetch?: FetchFn;
  } = {}) {
    this.url = url ?? deriveDefaultUrl(network);
    this.fetch = fetch ?? createFetchFn();
    this.network = networkFrom(network);
  }

  /** Returns `true` if the network is configured to 'mainnet', based on the TransactionVersion */
  isMainnet = () => this.network.transactionVersion === TransactionVersion.Mainnet;

  /**
   * Broadcast a serialized transaction to a Stacks node (which will validate and forward to the network).
   * @param transaction - The transaction to broadcast
   * @param attachment - Optional attachment to include with the transaction
   * @returns a Promise that resolves to a {@link TxBroadcastResult} object
   */
  broadcastTransaction = async (
    transaction: StacksTransaction,
    attachment?: Uint8Array | string
  ): Promise<TxBroadcastResult> => {
    // todo: should we use a opts object instead of positional args here?
    return broadcastTransaction({ transaction, attachment, api: this });
  };

  /**
   * Lookup the nonce for an address from a core node
   * @param address - The Stacks address to look up the next nonce for
   * @return A promise that resolves to a bigint of the next nonce
   */
  getNonce = async (address: string): Promise<bigint> => {
    return getNonce({ address, api: this });
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
    return estimateTransaction({ payload, estimatedLength, api: this });
  };

  /**
   * Fetch a contract's ABI
   * @param contractAddress - The contracts address
   * @param contractName - The contracts name
   * @returns A promise that resolves to a ClarityAbi if the operation succeeds
   */
  getAbi = async (contractAddress: string, contractName: string): Promise<ClarityAbi> => {
    return getAbi({ contractAddress, contractName, api: this });
  };

  // todo: migrate to new api pattern
  getNameInfo(fullyQualifiedName: string) {
    /*
      TODO: Update to v2 API URL for name lookups
    */
    const nameLookupURL = `${this.bnsLookupUrl}/v1/names/${fullyQualifiedName}`;
    return this.fetch(nameLookupURL)
      .then((resp: any) => {
        if (resp.status === 404) {
          throw new Error('Name not found');
        } else if (resp.status !== 200) {
          throw new Error(`Bad response status: ${resp.status}`);
        } else {
          return resp.json();
        }
      })
      .then((nameInfo: any) => {
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

export function deriveDefaultUrl(network: StacksNetwork | StacksNetworkName) {
  network = networkFrom(network);

  return !network || network.transactionVersion === TransactionVersion.Mainnet
    ? HIRO_MAINNET_URL // default to mainnet if no network is given or txVersion is mainnet
    : network.magicBytes === 'id'
    ? DEVNET_URL // default to devnet if magicBytes are devnet
    : HIRO_TESTNET_URL;
}
