import * as btc from '@scure/btc-signer';

// todo: auto-fetch or hardcode if final
// or replace with testnet final address
export const SBTC_PEG_ADDRESS = 'bcrt1pjzju437r8ldynactcxcgvmaqhfafgsxemej8lm9czvkwka4ffhaqxpc5d2';

export const SBTC_FT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.asset';

export enum MagicBytes {
  Mainnet = 'X2',
  Testnet = 'T2',
  Regtest = 'id',
}

export enum OpCode {
  PegIn = '3C',
  PegOut = '3E',
}

export type BitcoinNetwork = {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
  bip84: {
    coin: number;
  };
  magicBytes: string;
};

export const MAINNET: BitcoinNetwork = {
  ...btc.NETWORK,
  bip32: {
    public: 0x0488b21e,
    private: 0x0488ade4,
  },
  bip84: {
    coin: 0,
  },
  magicBytes: MagicBytes.Mainnet,
};

export const TESTNET: BitcoinNetwork = {
  ...btc.TEST_NETWORK,
  bip32: {
    public: 0x043587cf,
    private: 0x04358394,
  },
  bip84: {
    coin: 1,
  },
  magicBytes: MagicBytes.Testnet,
};

export const REGTEST: BitcoinNetwork = {
  ...TESTNET,
  bech32: 'bcrt',
  magicBytes: MagicBytes.Regtest,
};

// Estimates based on https://bitcoinops.org/en/tools/calc-size/
export const OVERHEAD_TX = 4 + 1 + 1 + 4; // new btc.Transaction().vsize
// const OVERHEAD_INPUT = 36 + 1 + 4 + 0.25;
// const OVERHEAD_OUTPUT = 8 + 1;
// const OVERHEAD_INPUT_P2PKH = 107;
export const VSIZE_INPUT_P2WPKH = 68;
// const OVERHEAD_OUTPUT_P2PKH = 25;
