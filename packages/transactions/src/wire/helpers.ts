import { TransactionVersion } from '@stacks/network';
import { c32address } from 'c32check';
import { addressHashModeToVersion } from '../address';
import { AddressHashMode, AddressVersion, PayloadType } from '../constants';
import { publicKeyIsCompressed, serializePublicKeyBytes } from '../keys';
import { AssetString } from '../types';
import { hashP2PKH, hashP2SH, hashP2WPKH, hashP2WSH } from '../utils';
import { createAsset, createContractPrincipal, createStandardPrincipal } from './create';
import {
  AddressWire,
  AssetWire,
  CoinbasePayloadWire,
  ContractCallPayload,
  ContractPrincipalWire,
  PayloadWire,
  PoisonPayloadWire,
  PublicKeyWire,
  SmartContractPayloadWire,
  StacksWireType,
  StandardPrincipalWire,
  TokenTransferPayloadWire,
} from './types';

export function addressFromHashMode(
  hashMode: AddressHashMode,
  txVersion: TransactionVersion,
  data: string
): AddressWire {
  const version = addressHashModeToVersion(hashMode, txVersion);
  return addressFromVersionHash(version, data);
}

export function addressFromPublicKeys(
  version: AddressVersion,
  hashMode: AddressHashMode,
  numSigs: number,
  // todo: `next` refactor to `requiredSignatures`, and opts object with network?
  publicKeys: PublicKeyWire[]
): AddressWire {
  if (publicKeys.length === 0) {
    throw Error('Invalid number of public keys');
  }

  if (hashMode === AddressHashMode.SerializeP2PKH || hashMode === AddressHashMode.SerializeP2WPKH) {
    if (publicKeys.length !== 1 || numSigs !== 1) {
      throw Error('Invalid number of public keys or signatures');
    }
  }

  if (
    hashMode === AddressHashMode.SerializeP2WPKH ||
    hashMode === AddressHashMode.SerializeP2WSH ||
    hashMode === AddressHashMode.SerializeP2WSHNonSequential
  ) {
    if (!publicKeys.map(p => p.data).every(publicKeyIsCompressed)) {
      throw Error('Public keys must be compressed for segwit');
    }
  }

  switch (hashMode) {
    case AddressHashMode.SerializeP2PKH:
      return addressFromVersionHash(version, hashP2PKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2WPKH:
      return addressFromVersionHash(version, hashP2WPKH(publicKeys[0].data));
    case AddressHashMode.SerializeP2SH:
    case AddressHashMode.SerializeP2SHNonSequential:
      return addressFromVersionHash(
        version,
        hashP2SH(numSigs, publicKeys.map(serializePublicKeyBytes))
      );
    case AddressHashMode.SerializeP2WSH:
    case AddressHashMode.SerializeP2WSHNonSequential:
      return addressFromVersionHash(
        version,
        hashP2WSH(numSigs, publicKeys.map(serializePublicKeyBytes))
      );
  }
}

export function addressFromVersionHash(version: AddressVersion, hash: string): AddressWire {
  return { type: StacksWireType.Address, version, hash160: hash };
}

export function addressToString(address: AddressWire): string {
  return c32address(address.version, address.hash160);
}

export function isTokenTransferPayload(p: PayloadWire): p is TokenTransferPayloadWire {
  return p.payloadType === PayloadType.TokenTransfer;
}
export function isContractCallPayload(p: PayloadWire): p is ContractCallPayload {
  return p.payloadType === PayloadType.ContractCall;
}
export function isSmartContractPayload(p: PayloadWire): p is SmartContractPayloadWire {
  return p.payloadType === PayloadType.SmartContract;
}
export function isPoisonPayload(p: PayloadWire): p is PoisonPayloadWire {
  return p.payloadType === PayloadType.PoisonMicroblock;
}
export function isCoinbasePayload(p: PayloadWire): p is CoinbasePayloadWire {
  return p.payloadType === PayloadType.Coinbase;
}

/** @ignore */
export function parseAssetString(id: AssetString): AssetWire {
  const [assetAddress, assetContractName, assetTokenName] = id.split(/\.|::/);
  const asset = createAsset(assetAddress, assetContractName, assetTokenName);
  return asset;
}

/**
 * Parses a principal string for either a standard principal or contract principal.
 * @param principalString - String in the format `{address}.{contractName}`
 * @example "SP13N5TE1FBBGRZD1FCM49QDGN32WAXM2E5F8WT2G.example-contract"
 * @example "SP13N5TE1FBBGRZD1FCM49QDGN32WAXM2E5F8WT2G"
 * @ignore
 */
export function parsePrincipalString(
  principalString: string
): StandardPrincipalWire | ContractPrincipalWire {
  if (principalString.includes('.')) {
    const [address, contractName] = principalString.split('.');
    return createContractPrincipal(address, contractName);
  } else {
    return createStandardPrincipal(principalString);
  }
}
