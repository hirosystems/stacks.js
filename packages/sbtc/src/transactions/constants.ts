import * as btc from '@scure/btc-signer';

export const SBTC_PEG_ADDRESS = 'tb1q3tj2fr9scwmcw3rq5m6jslva65f2rqjxt2t0zh'; // todo: auto-fetch or hardcode if final

export interface BitcoinNetwork {
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

export const NETWORK: BitcoinNetwork = btc.NETWORK;
export const TEST_NETWORK: BitcoinNetwork = btc.TEST_NETWORK;

export enum MagicBytes {
  Mainnet = '5832',
  Testnet = '5432',
}

export enum OpCode {
  PegIn = '3C',
  PegOut = '3E',
}

// Estimates based on https://bitcoinops.org/en/tools/calc-size/
export const OVERHEAD_TX = 4 + 1 + 1 + 4; // new btc.Transaction().vsize
// const OVERHEAD_INPUT = 36 + 1 + 4 + 0.25;
// const OVERHEAD_OUTPUT = 8 + 1;
// const OVERHEAD_INPUT_P2PKH = 107;
export const VSIZE_INPUT_P2WPKH = 68;
// const OVERHEAD_OUTPUT_P2PKH = 25;
