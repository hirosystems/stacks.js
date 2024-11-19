/**
 * The chain ID (unsigned 32-bit integer), used so transactions can't be replayed on other chains.
 * Similar to the {@link TransactionVersion}.
 */
export enum ChainId {
  Mainnet = 0x00000001,
  Testnet = 0x80000000,
}

/**
 * The **peer** network ID.
 * Typically not used in signing, but used for broadcasting to the P2P network.
 * It can also be used to determine the parent of a subnet.
 *
 * **Attention:**
 * For mainnet/testnet the v2/info response `.network_id` refers to the chain ID.
 * For subnets the v2/info response `.network_id` refers to the peer network ID and the chain ID (they are the same for subnets).
 * The `.parent_network_id` refers to the actual peer network ID (of the parent) in both cases.
 */
export enum PeerNetworkId {
  Mainnet = 0x17000000,
  Testnet = 0xff000000,
}

export const DEFAULT_CHAIN_ID = ChainId.Mainnet;

/**
 * The transaction version, used so transactions can't be replayed on other networks.
 * Similar to the {@link ChainId}.
 * Used internally for serializing and deserializing transactions.
 */
export enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

/**
 * Address versions for identifying address types in an encoded Stacks address.
 * The address version is a single byte, indicating the address type.
 * Every Stacks address starts with `S` followed by a single character indicating the address version.
 * The second character is the c32-encoded AddressVersion byte.
 */
export enum AddressVersion {
  /** `P` — A single-sig address for mainnet (starting with `SP`) */
  MainnetSingleSig = 22,
  /** `M` — A multi-sig address for mainnet (starting with `SM`) */
  MainnetMultiSig = 20,
  /** `T` — A single-sig address for testnet (starting with `ST`) */
  TestnetSingleSig = 26,
  /** `N` — A multi-sig address for testnet (starting with `SN`) */
  TestnetMultiSig = 21,
}

export const DEFAULT_TRANSACTION_VERSION = TransactionVersion.Mainnet;

/** @ignore */
export function whenTransactionVersion(transactionVersion: TransactionVersion) {
  return <T>(map: Record<TransactionVersion, T>): T => map[transactionVersion];
}
