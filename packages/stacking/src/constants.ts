/** Address versions corresponding to pox.clar, pox-2.clar */
export enum PoXAddressVersion {
  /** (b58/legacy) p2pkh address, and `hashbytes` is the 20-byte hash160 of a single public key */
  P2PKH = 0x00,
  /** (b58/legacy) p2sh address, and `hashbytes` is the 20-byte hash160 of a redeemScript script */
  P2SH = 0x01,
  /** (b58/legacy) p2wpkh-p2sh address, and `hashbytes` is the 20-byte hash160 of a p2wpkh witness script */
  P2SHP2WPKH = 0x02, // likely unused, as indistinguishable from P2SH
  /** (b58/legacy) p2wsh-p2sh address, and `hashbytes` is the 20-byte hash160 of a p2wsh witness script */
  P2SHP2WSH = 0x03, // likely unused, as indistinguishable from P2SH
  /** (bech32/segwit) p2wpkh address, and `hashbytes` is the 20-byte hash160 of the witness script */
  P2WPKH = 0x04,
  /** (bech32/segwit) p2wsh address, and `hashbytes` is the 32-byte sha256 of the witness script */
  P2WSH = 0x05,
  /** (bech32/segwit) p2tr address, and `hashbytes` is the 32-byte sha256 of the witness script */
  P2TR = 0x06,
}

/** @ignore */
export const BitcoinNetworkVersion = {
  mainnet: {
    P2PKH: 0x00, // 0
    P2SH: 0x05, // 5
  },
  testnet: {
    P2PKH: 0x6f, // 111
    P2SH: 0xc4, // 196
  },
  devnet: {
    // equivalent to testnet for our purposes
    P2PKH: 0x6f, // 111
    P2SH: 0xc4, // 196
  },
  mocknet: {
    // equivalent to testnet for our purposes
    P2PKH: 0x6f, // 111
    P2SH: 0xc4, // 196
  },
} as const;

/**
 * Valid prefix chars for mainnet and testnet P2PKH and P2SH addresses
 *  mainnet P2PKH: 1
 *  testnet P2PKH: m or n
 *  mainnet P2SH: 3
 *  testnet P2SH: 2
 * @ignore
 */
export const B58_ADDR_PREFIXES = /^(1|3|m|n|2)/;

/**
 * Valid prefixes for supported segwit address, structure is:
 * HRP PREFIX + SEPARATOR (always '1') + C32_ENCODED SEGWIT_VERSION_BYTE ('q' for 0, 'p' for 1) + HASHDATA
 * @ignore
 */
export const SEGWIT_V0_ADDR_PREFIX = /^(bc1q|tb1q|bcrt1q)/i;
export const SEGWIT_V1_ADDR_PREFIX = /^(bc1p|tb1p|bcrt1p)/i;

/**
 * Segwit Human-Readable Parts
 * Valid prefixs for mainnet and testnet bech32/segwit addresses
 * @ignore
 */
export const SegwitPrefix = {
  mainnet: 'bc',
  testnet: 'tb',
  devnet: 'bcrt',
  mocknet: 'bcrt',
} as const;
/** @ignore */
export const SEGWIT_ADDR_PREFIXES = /^(bc|tb)/i;

/** @ignore */
export const SEGWIT_V0 = 0;
/** @ignore */
export const SEGWIT_V1 = 1;

// Segwit/taproot address examples:
//   mainnet P2WPKH: bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4
//   testnet P2WPKH: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
//   mainnet P2WSH: bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3
//   testnet P2WSH: tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7
//   mainnet P2TR: bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297
//   testnet P2TR: tb1p6h5fuzmnvpdthf5shf0qqjzwy7wsqc5rhmgq2ks9xrak4ry6mtrscsqvzp

/**
 * Transitional periods from the 2.1 launch
 * @see SIP-015
 */
export enum PoxOperationPeriod {
  /** Period 1: This is before the 2.1 fork. */
  Period1 = 'Period1',
  /** Period 2a: This is after the 2.1 fork, but before v1_unlock_height. */
  Period2a = 'Period2a', //
  /** Period 2b: This is after the 2.1 fork, after v1_unlock_height, but before the first PoX-2 reward cycle. */
  Period2b = 'Period2b',
  /** Period 3: This is after the first PoX-2 reward cycle has begun. The original PoX contract state will no longer have any impact on reward sets. */
  Period3 = 'Period3',
}

export enum StackingErrors {
  // taken from https://github.com/stacks-network/stacks-blockchain/blob/088ff00761b27a12bfaf19dab5743e77e8ca4d0c/src/chainstate/stacks/boot/pox-3.clar
  ERR_STACKING_UNREACHABLE = 255,
  ERR_STACKING_CORRUPTED_STATE = 254,
  ERR_STACKING_INSUFFICIENT_FUNDS = 1,
  ERR_STACKING_INVALID_LOCK_PERIOD = 2,
  ERR_STACKING_ALREADY_STACKED = 3,
  ERR_STACKING_NO_SUCH_PRINCIPAL = 4,
  ERR_STACKING_EXPIRED = 5,
  ERR_STACKING_STX_LOCKED = 6,
  ERR_STACKING_PERMISSION_DENIED = 9,
  ERR_STACKING_THRESHOLD_NOT_MET = 11,
  ERR_STACKING_POX_ADDRESS_IN_USE = 12,
  ERR_STACKING_INVALID_POX_ADDRESS = 13,
  ERR_STACKING_ALREADY_REJECTED = 17,
  ERR_STACKING_INVALID_AMOUNT = 18,
  ERR_NOT_ALLOWED = 19,
  ERR_STACKING_ALREADY_DELEGATED = 20,
  ERR_DELEGATION_EXPIRES_DURING_LOCK = 21,
  ERR_DELEGATION_TOO_MUCH_LOCKED = 22,
  ERR_DELEGATION_POX_ADDR_REQUIRED = 23,
  ERR_INVALID_START_BURN_HEIGHT = 24,
  ERR_NOT_CURRENT_STACKER = 25,
  ERR_STACK_EXTEND_NOT_LOCKED = 26,
  ERR_STACK_INCREASE_NOT_LOCKED = 27,
  ERR_DELEGATION_NO_REWARD_SLOT = 28,
  ERR_DELEGATION_WRONG_REWARD_SLOT = 29,
  ERR_STACKING_IS_DELEGATED = 30,
  ERR_STACKING_NOT_DELEGATED = 31,
}
