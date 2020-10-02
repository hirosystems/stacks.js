enum ChainID {
  Testnet = 0x80000000,
  Mainnet = 0x00000001,
}

enum TransactionVersion {
  Mainnet = 0x00,
  Testnet = 0x80,
}

export { ChainID, TransactionVersion };

/**
 * @ignore
 */
export const BLOCKSTACK_DEFAULT_GAIA_HUB_URL = 'https://hub.blockstack.org';
