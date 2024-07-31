import {
  STACKS_MAINNET,
  StacksNetwork,
  StacksNetworkName,
  TransactionVersion,
  networkFrom,
} from '@stacks/network';
import { AddressHashMode, AddressVersion } from './constants';

/**
 * Translates the tx auth hash mode to the corresponding address version.
 * @see https://github.com/blockstack/stacks-blockchain/blob/master/sip/sip-005-blocks-and-transactions.md#transaction-authorization
 */
export function addressHashModeToVersion(
  hashMode: AddressHashMode,
  network?: StacksNetworkName | StacksNetwork
): AddressVersion {
  network = networkFrom(network ?? STACKS_MAINNET);
  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      switch (network.transactionVersion) {
        case TransactionVersion.Mainnet:
          return AddressVersion.MainnetSingleSig;
        case TransactionVersion.Testnet:
          return AddressVersion.TestnetSingleSig;
        default:
          throw new Error(
            `Unexpected transactionVersion ${network.transactionVersion} for hashMode ${hashMode}`
          );
      }
    case AddressHashMode.SerializeP2SH:
    case AddressHashMode.SerializeP2SHNonSequential:
    case AddressHashMode.SerializeP2WPKH:
    case AddressHashMode.SerializeP2WSH:
    case AddressHashMode.SerializeP2WSHNonSequential:
      switch (network.transactionVersion) {
        case TransactionVersion.Mainnet:
          return AddressVersion.MainnetMultiSig;
        case TransactionVersion.Testnet:
          return AddressVersion.TestnetMultiSig;
        default:
          throw new Error(
            `Unexpected transactionVersion ${network.transactionVersion} for hashMode ${hashMode}`
          );
      }
    default:
      throw new Error(`Unexpected hashMode ${hashMode}`);
  }
}
