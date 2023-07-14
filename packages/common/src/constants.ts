/**
 * The NetworkID is used to identify the blockchain network in p2p.
 * It is NOT used in signing or verifying signatures.
 */
export enum NetworkID {
  Mainnet = 0x17000000, // 385875968
  Testnet = 0xff000000, // 4278190080
}

/**
 * The ChainID is used to identify the blockchain chain in transactions.
 * It is used in the signed transaction serialization.
 * It should be unique, to prevent replay attacks across different chains.
 */
export enum ChainID {
  Mainnet = 0x00000001,
  Testnet = 0x80000000,
}

/**
 * The TransactionVersion is an additional network identifier used in
 * transactions.
 * It is used in the signed transaction serialization.
 */
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
