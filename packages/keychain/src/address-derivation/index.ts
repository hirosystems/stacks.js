import { compressPrivateKey, ecPrivateKeyToHexString } from '@stacks/encryption';
import { ChainID, getAddressFromPrivateKey, TransactionVersion } from '@stacks/transactions';
import { BIP32Interface } from 'bitcoinjs-lib';

const networkDerivationPath = `m/44'/5757'/0'/0/0`;

export const derivationPaths = {
  [ChainID.Mainnet]: networkDerivationPath,
  [ChainID.Testnet]: networkDerivationPath,
};

/** @deprecated */
export function getDerivationPath(chain: ChainID) {
  return derivationPaths[chain];
}

/** @deprecated */
export function deriveStxAddressChain(chain: ChainID) {
  return (rootNode: BIP32Interface) => {
    const childKey = rootNode.derivePath(getDerivationPath(chain));
    if (!childKey.privateKey) {
      throw new Error('Unable to derive private key from `rootNode`, bip32 master keychain');
    }
    const privateKey = ecPrivateKeyToHexString(compressPrivateKey(childKey.privateKey));
    const txVersion =
      chain === ChainID.Mainnet ? TransactionVersion.Mainnet : TransactionVersion.Testnet;
    return {
      childKey,
      address: getAddressFromPrivateKey(privateKey, txVersion),
      privateKey,
    };
  };
}
