import { TransactionVersion } from '@stacks/network';
import { c32address } from 'c32check';
import { AddressHashMode, AddressVersion, StacksMessageType } from './constants';

export interface Address {
  readonly type: StacksMessageType.Address;
  readonly version: AddressVersion;
  readonly hash160: string;
}

/**
 * Translates the tx auth hash mode to the corresponding address version.
 * @see https://github.com/blockstack/stacks-blockchain/blob/master/sip/sip-005-blocks-and-transactions.md#transaction-authorization
 */
export function addressHashModeToVersion(
  hashMode: AddressHashMode,
  txVersion: TransactionVersion
): AddressVersion {
  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      switch (txVersion) {
        case TransactionVersion.Mainnet:
          return AddressVersion.MainnetSingleSig;
        case TransactionVersion.Testnet:
          return AddressVersion.TestnetSingleSig;
        default:
          throw new Error(
            `Unexpected txVersion ${JSON.stringify(txVersion)} for hashMode ${hashMode}`
          );
      }
    case AddressHashMode.SerializeP2SH:
    case AddressHashMode.SerializeP2WPKH:
    case AddressHashMode.SerializeP2WSH:
      switch (txVersion) {
        case TransactionVersion.Mainnet:
          return AddressVersion.MainnetMultiSig;
        case TransactionVersion.Testnet:
          return AddressVersion.TestnetMultiSig;
        default:
          throw new Error(
            `Unexpected txVersion ${JSON.stringify(txVersion)} for hashMode ${hashMode}`
          );
      }
    default:
      throw new Error(`Unexpected hashMode ${JSON.stringify(hashMode)}`);
  }
}

export function addressFromVersionHash(version: AddressVersion, hash: string): Address {
  return { type: StacksMessageType.Address, version, hash160: hash };
}

export function addressToString(address: Address): string {
  return c32address(address.version, address.hash160);
}
