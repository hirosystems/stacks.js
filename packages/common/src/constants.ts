export enum ChainID {
  Testnet = 0x80000000,
  Mainnet = 0x00000001,
}

export enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

/**
 * @ignore
 */
export const PRIVATE_KEY_COMPRESSED_LENGTH = 33;

/**
 * @ignore
 */
export const PRIVATE_KEY_UNCOMPRESSED_LENGTH = 32;

/**
 * @ignore
 */
export const BLOCKSTACK_DEFAULT_GAIA_HUB_URL = 'https://hub.blockstack.org';
