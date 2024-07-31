import { TransactionVersion } from '@stacks/network';
import { AddressHashMode, AddressVersion } from './constants';

/**
 * Translates the tx auth hash mode to the corresponding address version.
 * @see https://github.com/blockstack/stacks-blockchain/blob/master/sip/sip-005-blocks-and-transactions.md#transaction-authorization
 */
export function addressHashModeToVersion(
  hashMode: AddressHashMode,
  txVersion: TransactionVersion
): AddressVersion {
  // todo: `next` refacto with network param
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
    case AddressHashMode.SerializeP2SHNonSequential:
    case AddressHashMode.SerializeP2WPKH:
    case AddressHashMode.SerializeP2WSH:
    case AddressHashMode.SerializeP2WSHNonSequential:
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
