// @ts-ignore
import { Buffer } from '@stacks/common';
import {
  AddressHashMode,
  BufferCV,
  ClarityType,
  ClarityValue,
  TupleCV,
} from '@stacks/transactions';
import { address } from 'bitcoinjs-lib';
import { StackingErrors } from './constants';

export class InvalidAddressError extends Error {
  innerError?: Error;
  constructor(address: string, innerError?: Error) {
    const msg = `${address} is not a valid P2PKH or P2SH address -- native P2WPKH and native P2WSH are not supported in PoX.`;
    super(msg);
    this.message = msg;
    this.name = this.constructor.name;
    this.innerError = innerError;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export const BitcoinNetworkVersion = {
  mainnet: {
    P2PKH: 0x00, // 0
    P2SH: 0x05, // 5
  },
  testnet: {
    P2PKH: 0x6f, // 111
    P2SH: 0xc4, // 196
  },
} as const;

export function btcAddressVersionToHashMode(btcAddressVersion: number): AddressHashMode {
  switch (btcAddressVersion) {
    case BitcoinNetworkVersion.mainnet.P2PKH:
      return AddressHashMode.SerializeP2PKH;
    case BitcoinNetworkVersion.testnet.P2PKH:
      return AddressHashMode.SerializeP2PKH;
    case BitcoinNetworkVersion.mainnet.P2SH:
      return AddressHashMode.SerializeP2SH;
    case BitcoinNetworkVersion.testnet.P2SH:
      return AddressHashMode.SerializeP2SH;
    default:
      throw new Error('Invalid pox address version');
  }
}

export function hashModeToBtcAddressVersion(
  hashMode: AddressHashMode,
  network: 'mainnet' | 'testnet'
): number {
  if (!['mainnet', 'testnet'].includes(network)) {
    throw new Error(`Invalid network argument: ${network}`);
  }
  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      return BitcoinNetworkVersion[network].P2PKH;
    case AddressHashMode.SerializeP2SH:
      return BitcoinNetworkVersion[network].P2SH;
    default:
      throw new Error(`Invalid pox address hash mode: ${hashMode}`);
  }
}

export function getAddressHashMode(btcAddress: string) {
  try {
    const { version } = address.fromBase58Check(btcAddress);
    return btcAddressVersionToHashMode(version);
  } catch (error: any) {
    throw new InvalidAddressError(btcAddress, error);
  }
}

export function decodeBtcAddress(btcAddress: string) {
  let b58Result: address.Base58CheckResult;
  try {
    b58Result = address.fromBase58Check(btcAddress);
  } catch (error: any) {
    throw new InvalidAddressError(btcAddress, error);
  }
  const hashMode = btcAddressVersionToHashMode(b58Result.version);
  return {
    hashMode,
    data: b58Result.hash,
  };
}

export function extractPoxAddressFromClarityValue(poxAddrClarityValue: ClarityValue) {
  const clarityValue = poxAddrClarityValue as TupleCV;
  if (clarityValue.type !== ClarityType.Tuple || !clarityValue.data) {
    throw new Error('Invalid argument, expected ClarityValue to be a TupleCV');
  }
  if (!('version' in clarityValue.data) || !('hashbytes' in clarityValue.data)) {
    throw new Error(
      'Invalid argument, expected Clarity tuple value to contain `version` and `hashbytes` keys'
    );
  }
  const versionCV = clarityValue.data['version'] as BufferCV;
  const hashBytesCV = clarityValue.data['hashbytes'] as BufferCV;
  if (versionCV.type !== ClarityType.Buffer || hashBytesCV.type !== ClarityType.Buffer) {
    throw new Error(
      'Invalid argument, expected Clarity tuple value to contain `version` and `hashbytes` buffers'
    );
  }
  return {
    version: versionCV.buffer,
    hashBytes: hashBytesCV.buffer,
  };
}

export type PoxAddressArgs =
  | [version: Buffer, hashBytes: Buffer, network: 'mainnet' | 'testnet']
  | [poxAddrClarityValue: ClarityValue, network: 'mainnet' | 'testnet'];

export function poxAddressToBtcAddress(...args: PoxAddressArgs): string {
  let version: Buffer, hashBytes: Buffer, network: 'mainnet' | 'testnet';
  if (args.length === 3) {
    [version, hashBytes, network] = args;
  } else if (args.length === 2) {
    ({ version, hashBytes } = extractPoxAddressFromClarityValue(args[0]));
    network = args[1];
  } else {
    throw new Error('Invalid arguments');
  }
  if (version.byteLength !== 1) {
    throw new Error(`Invalid byte length for version buffer: ${version.toString('hex')}`);
  }
  if (hashBytes.byteLength !== 20) {
    throw new Error(`Invalid byte length for hashBytes: ${hashBytes.toString('hex')}`);
  }
  const btcNetworkVersion = hashModeToBtcAddressVersion(version[0], network);
  const btcAddress = address.toBase58Check(hashBytes, btcNetworkVersion);
  return btcAddress;
}

export function getBTCAddress(version: Buffer, checksum: Buffer) {
  const btcAddress = address.toBase58Check(checksum, Number(version.toString()));
  return btcAddress;
}

export function getErrorString(error: StackingErrors): string {
  switch (error) {
    case StackingErrors.ERR_STACKING_UNREACHABLE:
      return 'Stacking unreachable';
    case StackingErrors.ERR_STACKING_INSUFFICIENT_FUNDS:
      return 'Insufficient funds';
    case StackingErrors.ERR_STACKING_INVALID_LOCK_PERIOD:
      return 'Invalid lock period';
    case StackingErrors.ERR_STACKING_ALREADY_STACKED:
      return 'Account already stacked. Concurrent stacking not allowed.';
    case StackingErrors.ERR_STACKING_NO_SUCH_PRINCIPAL:
      return 'Principal does not exist';
    case StackingErrors.ERR_STACKING_EXPIRED:
      return 'Stacking expired';
    case StackingErrors.ERR_STACKING_STX_LOCKED:
      return 'STX balance is locked';
    case StackingErrors.ERR_STACKING_PERMISSION_DENIED:
      return 'Permission denied';
    case StackingErrors.ERR_STACKING_THRESHOLD_NOT_MET:
      return 'Stacking threshold not met';
    case StackingErrors.ERR_STACKING_POX_ADDRESS_IN_USE:
      return 'PoX address already in use';
    case StackingErrors.ERR_STACKING_INVALID_POX_ADDRESS:
      return 'Invalid PoX address';
    case StackingErrors.ERR_STACKING_ALREADY_REJECTED:
      return 'Stacking already rejected';
    case StackingErrors.ERR_STACKING_INVALID_AMOUNT:
      return 'Invalid amount';
    case StackingErrors.ERR_NOT_ALLOWED:
      return 'Stacking not allowed';
    case StackingErrors.ERR_STACKING_ALREADY_DELEGATED:
      return 'Already delegated';
    case StackingErrors.ERR_DELEGATION_EXPIRES_DURING_LOCK:
      return 'Delegation expires during lock period';
    case StackingErrors.ERR_DELEGATION_TOO_MUCH_LOCKED:
      return 'Delegation too much locked';
    case StackingErrors.ERR_DELEGATION_POX_ADDR_REQUIRED:
      return 'PoX address required for delegation';
    case StackingErrors.ERR_INVALID_START_BURN_HEIGHT:
      return 'Invalid start burn height';
  }
}
