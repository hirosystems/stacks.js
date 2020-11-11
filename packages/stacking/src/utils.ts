import { AddressHashMode } from '@stacks/transactions';
import { address } from 'bitcoinjs-lib';
import BN from 'bn.js';

export function getAddressHashMode(btcAddress: string) {
  if (btcAddress.startsWith('bc1') || btcAddress.startsWith('tb1')) {
    const { data } = address.fromBech32(btcAddress);
    if (data.length === 32) {
      return AddressHashMode.SerializeP2WSH;
    } else {
      return AddressHashMode.SerializeP2WPKH;
    }
  } else {
    const { version } = address.fromBase58Check(btcAddress);
    switch (version) {
      case 0:
        return AddressHashMode.SerializeP2PKH;
      case 111:
        return AddressHashMode.SerializeP2PKH;
      case 5:
        return AddressHashMode.SerializeP2SH;
      case 196:
        return AddressHashMode.SerializeP2SH;
      default: 
        throw new Error('Invalid pox address version');
    }
  }
}

export function convertBTCAddress(btcAddress: string) {
  const hashMode = getAddressHashMode(btcAddress);
  if (btcAddress.startsWith('bc1') || btcAddress.startsWith('tb1')) {
    const { data } = address.fromBech32(btcAddress);
    return {
      hashMode,
      data
    }
  } else {
    const { hash } = address.fromBase58Check(btcAddress);
    return {
      hashMode,
      data: hash
    }
  }
}

export function getBTCAddress(version: Buffer, checksum: Buffer) {
  const btcAddress = address.toBase58Check(checksum, new BN(version).toNumber());
  return btcAddress;
}