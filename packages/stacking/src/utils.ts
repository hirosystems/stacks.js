// @ts-ignore
import { Buffer } from '@stacks/common';
import { AddressHashMode } from '@stacks/transactions';
import { address } from 'bitcoinjs-lib';
import BN from 'bn.js';
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

export function btcAddressVersionToHashMode(btcAddressVersion: number): AddressHashMode {
  switch (btcAddressVersion) {
    case 0: // btc mainnet P2PKH
      return AddressHashMode.SerializeP2PKH;
    case 111: // btc mainnet P2PKH
      return AddressHashMode.SerializeP2PKH;
    case 5: // btc mainnet P2SH
      return AddressHashMode.SerializeP2SH;
    case 196: // btc testnet P2SH
      return AddressHashMode.SerializeP2SH;
    default:
      throw new Error('Invalid pox address version');
  }
}

export function getAddressHashMode(btcAddress: string) {
  try {
    const { version } = address.fromBase58Check(btcAddress);
    return btcAddressVersionToHashMode(version);
  } catch (error) {
    throw new InvalidAddressError(btcAddress, error);
  }
}

export function decodeBtcAddress(btcAddress: string) {
  let b58Result: address.Base58CheckResult;
  try {
    b58Result = address.fromBase58Check(btcAddress);
  } catch (error) {
    throw new InvalidAddressError(btcAddress, error);
  }
  const hashMode = btcAddressVersionToHashMode(b58Result.version);
  return {
    hashMode,
    data: b58Result.hash,
  };
}

export function getBTCAddress(version: Buffer, checksum: Buffer) {
  const btcAddress = address.toBase58Check(checksum, new BN(version).toNumber());
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
