import { AddressVersion } from '@stacks/transactions'
import { c32addressDecode, c32address } from 'c32check/lib/address'
import { versionByteToDidType } from '../constants'
import { DIDParseError, DIDParseErrorCodes } from '../errors'

/*
 * Converts a mainnet / testnet / off-chain c32 encoded address to a b58 encoded uncompressed address
 * input can either be a b58 encoded address or a c32 encoded one
 */

export const toMainnetAddress = (address: string) => {
  // In case we get a c32 encoded address, we re-encode using the mainnet version byte
  const [version, hash] = c32addressDecode(address)
  const didMetadata = versionByteToDidType[version]

  if (didMetadata) {
    return c32address(AddressVersion.MainnetSingleSig, hash)
  }

  throw new DIDParseError(DIDParseErrorCodes.InvalidVersionByte)
}
