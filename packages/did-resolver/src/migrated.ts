import { identity } from 'ramda'
import {
  decodeFQN,
  eitherToFuture,
  encodeFQN,
  getApiUrl,
  getPublicKeyUsingZoneFile,
  parseZoneFileAndExtractNameinfo,
  toMainnetAddress,
} from './utils/'
import { StacksV2DID } from './types'

import { fetchNameInfo, fetchNameOwnedByAddress } from './api'
import { chain, map, reject } from 'fluture'
import { StacksNetwork } from '@stacks/network'
import { DIDResolutionError, DIDResolutionErrorCodes } from './errors'

// TODO Define and export an utility to derive a V2 Stacks DID given a V1 DID
// TODO This resolution step needs to happen via a proxy call @block.
export const getPublicKeyForMigratedDid = ({ address }: StacksV2DID, network: StacksNetwork) =>
  fetchNameOwnedByAddress(getApiUrl(network), address)
    .pipe(map(decodeFQN))
    .pipe(chain(eitherToFuture))
    .pipe(chain(fqn => fetchNameInfo(network, fqn)))
    .pipe(
      chain(({ last_txid, status, address, zonefile }) => {
        // Names which were migrated list 0x as their registration transaction ID
        // and name-register as their migration transaction
        const migrateddTxId = '0x'
        const migratedContractCall = 'name-register'
        if (last_txid === migrateddTxId && status !== migratedContractCall) {
          return reject(new DIDResolutionError(DIDResolutionErrorCodes.InvalidMigrationTx))
        }

        if (toMainnetAddress(address) !== toMainnetAddress(address)) {
          return reject(
            new DIDResolutionError(
              DIDResolutionErrorCodes.MigratedOwnerMissmatch,
              'BNS name owner at time of migration does not match DID'
            )
          )
        }

        return parseZoneFileAndExtractNameinfo(zonefile)
          .map(({ name, namespace, subdomain }) =>
            getPublicKeyUsingZoneFile(zonefile, address).pipe(
              map(key => ({
                name: encodeFQN({
                  name,
                  namespace,
                  subdomain,
                }),
                publicKey: key,
              }))
            )
          )
          .fold(reject, identity)
      })
    )
