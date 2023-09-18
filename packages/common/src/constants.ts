/**
 * The **chain** ID.
 * Is used for signing, so transactions can't be replayed on other chains.
 */
export enum ChainID {
  Testnet = 0x80000000,
  Mainnet = 0x00000001,
}

/**
 * The **transaction** version.
 * Is used for signing, so transactions can't be replayed on other networks.
 */
export enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

/**
 * The **peer** network ID.
 * Typically not used in signing, but used for broadcasting to the P2P network.
 * It can also be used to determine the parent of a subnet.
 *
 * Attention:
 * For mainnet/testnet the v2/info response `.network_id` refers to the chain ID
 * For subnets the v2/info response `.network_id` refers to the peer network ID and the chain ID (they are the same for subnets)
 * The `.parent_network_id` refers to the actual peer network ID (of the parent) in both cases
 */
export enum PeerNetworkID {
  Mainnet = 0x17000000,
  Testnet = 0xff000000,
}

/** @ignore internal */
export const PRIVATE_KEY_COMPRESSED_LENGTH = 33;

/** @ignore internal */
export const PRIVATE_KEY_UNCOMPRESSED_LENGTH = 32;

/** @ignore internal */
export const BLOCKSTACK_DEFAULT_GAIA_HUB_URL = 'https://hub.blockstack.org';
