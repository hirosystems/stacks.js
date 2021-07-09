import { identity } from 'ramda'
import {
  fetchAndVerifySignedToken,
  createRejectedFuture,
  decodeFQN,
  eitherToFuture,
  encodeFQN,
  getApiUrl,
  buildDidDoc,
  parseStacksV2DID,
  isMigratedOnChainDid,
  ensureZonefileMatchesName,
  findSubdomainZoneFileByName,
  parseZoneFileAndExtractNameinfo,
  mapDidToBNSName,
} from './utils/'
import { StacksV2DID } from './types'
import { fetchNameInfo, getCurrentBlockNumber } from './api'
import { chain, map, resolve as fResolve, FutureInstance, promise } from 'fluture'
import { getPublicKeyForMigratedDid } from './migrated'
import { Either, Right } from 'monet'
import { DIDDocument } from 'did-resolver'
import { StacksMainnet, StacksNetwork } from '@stacks/network'
import { DIDResolutionError, DIDResolutionErrorCodes } from './errors'

const getPublicKeyForStackV2DID = (
  did: StacksV2DID,
  network: StacksNetwork
): FutureInstance<Error, { publicKey: string; name: string }> =>
  mapDidToBNSName(did, network).pipe(
    chain(({ name, namespace, subdomain, tokenUrl }) =>
      fetchAndVerifySignedToken(tokenUrl, did.address).pipe(
        map(key => ({
          publicKey: key,
          name: encodeFQN({ name, namespace, subdomain }),
        }))
      )
    )
  )

const postResolve = (
  fqn: string,
  did: string,
  network: StacksNetwork
): FutureInstance<Error, { did: string; publicKey: string, tokenUrl: string }> =>
  eitherToFuture(decodeFQN(fqn)).pipe(
    chain(decodedFQN =>
      fetchNameInfo(network, decodedFQN).pipe(
        chain(({ status, expire_block, zonefile, address }) =>
          status === 'name-revoke'
            ? createRejectedFuture<Error, { did: string; publicKey: string, tokenUrl: string }>(
                new DIDResolutionError(
                  DIDResolutionErrorCodes.DIDDeactivated,
                  'Underlying BNS name revoked'
                )
              )
            : getCurrentBlockNumber(getApiUrl(network))
                .pipe(
                  chain(currentBlock =>
                    expire_block > currentBlock
                      ? createRejectedFuture<Error, boolean>(
                          new DIDResolutionError(
                            DIDResolutionErrorCodes.DIDExpired,
                            'Underlying BNS name expired'
                          )
                        )
                      : fResolve(true)
                  )
                )
                .pipe(
                  map(() =>
                    decodedFQN.subdomain
                      ? findSubdomainZoneFileByName(zonefile, decodedFQN.subdomain)
                      : (Right({
                          zonefile: zonefile,
                          subdomain: undefined,
                          owner: address,
                        }) as Either<
                          Error,
                          {
                            zonefile: string
                            subdomain: undefined
                            owner: string
                          }
                        >)
                  )
                )
                .pipe(
                  map(v =>
                    v.flatMap(({ zonefile, subdomain, owner }) =>
                      ensureZonefileMatchesName({
                        zonefile,
                        name: decodedFQN.name,
                        namespace: decodedFQN.namespace,
                        subdomain,
                      })
                        .flatMap(parseZoneFileAndExtractNameinfo)
                        .map(nameInfo => ({ ...nameInfo, owner }))
                    )
                  )
                )
                .pipe(chain(eitherToFuture))
                .pipe(chain(({ tokenUrl, owner }) => fetchAndVerifySignedToken(tokenUrl, owner).pipe(map(publicKey => ({
                  publicKey,
                  did,
                  tokenUrl
                })))))
        )
      )
    )
  )

export const getResolver = (stacksNetwork: StacksNetwork = new StacksMainnet()) => {
  const resolve = (did: string) =>
    promise(
      parseStacksV2DID(did)
        .map(parsedDID =>
          (isMigratedOnChainDid(parsedDID)
            ? getPublicKeyForMigratedDid(parsedDID, stacksNetwork)
            : getPublicKeyForStackV2DID(parsedDID, stacksNetwork)
          ).pipe(chain(({ name }) => postResolve(name, did, stacksNetwork).pipe(map(buildDidDoc))))
        )
        .fold(e => createRejectedFuture<Error, DIDDocument>(e), identity)
    )

  return resolve
}
