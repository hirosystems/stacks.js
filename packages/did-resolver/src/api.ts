import 'isomorphic-fetch'
import { identity, prop } from 'ramda'
import { encaseP, map, resolve, chain, reject, FutureInstance } from 'fluture'
import { encodeFQN, getApiUrl, stripHexPrefixIfPresent } from './utils/'
import { BNS_ADDRESSES } from './constants'
import {
  bufferCVFromString,
  callReadOnlyFunction,
  ClarityValue,
  ReadOnlyFunctionOptions,
  cvToJSON,
  getAddressFromPublicKey,
  getPublicKey,
  makeRandomPrivKey,
} from '@stacks/transactions'
import { StacksNetwork } from '@stacks/network'
import { Maybe, None, Some } from 'monet'
import { DIDResolutionError, DIDResolutionErrorCodes } from './errors'

/**
 * Wraps the fetch function to return a future instnace as opposed to a promise.
 * Used by all functions in this file
 */

const fetchJSON = <T>(endpoint: string): FutureInstance<Error, T> => {
  return encaseP<Error, T, string>(() => fetch(endpoint).then(res => res.json() as Promise<T>))(
    endpoint
  )
}

/**
 * Given a on-chain BNS name, will return the latest zonefile associated with it.
 * An optional zonefileHash argument can be passed to fetch a specific historical zonefile associated with a name
 *
 * @returns a future which resolves to the zonefile as a string.
 */

export const fetchZoneFileForName = (
  apiEndpoint: string,
  args: {
    name: string
    namespace: string
    zonefileHash?: string
  }
): FutureInstance<Error, string> => {
  const fqn = encodeFQN({ name: args.name, namespace: args.namespace })
  const endpoint = `${apiEndpoint}/v1/names/${fqn}/zonefile/${args.zonefileHash || ''}`

  return fetchJSON<{ zonefile: string }>(endpoint).pipe(map(prop('zonefile')))
}

/**
 * Given a c32 encoded Stacks Address, will return a BNS name associated with it (if one is found)
 * @note One principal can only map to one on-chain name, therefore we don't expect to receive multiple results here
 *
 * @returns a future which resolves to the BNS name owned by the address.
 */

export const fetchNameOwnedByAddress = (
  apiEndpoint: string,
  address: string
): FutureInstance<Error, string> =>
  fetchJSON<{ names: string[] }>(`${apiEndpoint}/v1/addresses/stacks/${address}`)
    .pipe(map(prop('names')))
    .pipe(
      chain(names =>
        names?.length === 1
          ? resolve(names[0])
          : reject(new DIDResolutionError(DIDResolutionErrorCodes.NoMigratedNamesFound))
      )
    )

type NameInfo = {
  address: string
  blockchain: string
  expire_block: number
  last_txid: string
  status: string
  zonefile: string
  zonefile_hash: string
}

/**
 * Given a BNS name, will query a Stacks node for the latest info name state / info
 * @returns - a {@link NameInfo} object with the name state received from the BNS contract / Stacks node
 */

export const fetchNameInfo = (
  network: StacksNetwork,
  {
    name,
    namespace,
  }: {
    name: string
    namespace: string
  }
): FutureInstance<Error, NameInfo> => {
  const endpoint = `${getApiUrl(network)}/v1/names/${encodeFQN({ name, namespace })}`

  return fetchJSON<NameInfo>(endpoint).pipe(
    chain(res => {
      return fetchNameInfoFromContract({
        name,
        namespace,
        network,
      }).pipe(
        map(someResult =>
          someResult
            .map(({ address, zonefile_hash }) => {
              if (
                stripHexPrefixIfPresent(zonefile_hash) ===
                stripHexPrefixIfPresent(res.zonefile_hash)
              ) {
                return {
                  ...res,
                  address,
                }
              }
              return res
            })
            .cata(() => res, identity)
        )
      )
    })
  )
}

type NameResolveResult = {
  zonefile_hash: string
  address: string
}

/**
 * Given a BNS name, will query a the BNS contract directly for the latest state associated with a BNS name
 * A instance of a {@link StacksNetwork} object is required to interact with the contract.
 *
 * @returns - a {@link NameInfo } object name with the state received from the BNS contract
 */

const fetchNameInfoFromContract = ({
  name,
  namespace,
  network,
}: {
  name: string
  namespace: string
  network: StacksNetwork
}): FutureInstance<Error, Maybe<NameResolveResult>> => {
  const bnsDeployment = network.isMainnet() ? BNS_ADDRESSES.main : BNS_ADDRESSES.test
  const [contractAddress, contractName] = bnsDeployment.split('.')

  const senderAddress = getAddressFromPublicKey(getPublicKey(makeRandomPrivKey()).data)

  const options = {
    contractAddress,
    contractName,
    functionName: 'name-resolve',
    functionArgs: [bufferCVFromString(namespace), bufferCVFromString(name)],
    network,
    senderAddress,
  }

  return encaseP<Error, ClarityValue, ReadOnlyFunctionOptions>(callReadOnlyFunction)(options).pipe(
    chain(result => {
      const { value, success } = cvToJSON(result)
      if (!success) {
        return resolve(None())
      }

      return resolve(
        Some({
          zonefile_hash: value.value['zonefile-hash'].value as string,
          address: value.value.owner.value,
        })
      )
    })
  )
}

type SucccessFetchTxResponse = {
  tx_id: string
  tx_status: 'success' | "pending"
  [k: string]: any
}

type FetchTransactionResponse =
  | SucccessFetchTxResponse
  | {
      error: string
    }

/**
 * Given a Stacks transaction ID, will attempt to retrieve the corresponding transaction object
 * from a Stacks blockchain node
 *
 * @returns the corresponding Stacks transaction object if found
 */

export const fetchTransactionById = (apiEndpoint: string, txId: string) => {
  const endpoint = `${apiEndpoint}/extended/v1/tx/${txId}?event_offset=0&event_limit=96`
  return fetchJSON<FetchTransactionResponse>(endpoint).pipe(
    chain(res => {
      if (res.error) {
        return reject(new DIDResolutionError(DIDResolutionErrorCodes.InvalidAnchorTx, res.error))
      } else {
        return resolve(res as SucccessFetchTxResponse)
      }
    })
  )
}

/**
 * Helper function, makes a GET request to the supplied endpoint.
 * Assumes the response is an array containing one JSON Web Token
 *
 * @returns the JWT at the URL if found
 */

export const fetchSignedToken = (endpoint: string) =>
  fetchJSON<any[]>(endpoint).pipe(map(el => el[0]))

/**
 * Helper function, returns all names known to a Stacks node,
 * not used by the resolver directly, but as part of test code / dev helpers
 *
 * @returns an array of BNS names
 */

export const fetchAllNames =
  (apiEndpoint: string) =>
  (page = 0) =>
    fetchJSON<string[]>(`${apiEndpoint}/v1/names?page=${page}`)

/**
 * Helper function to get the current Stacks chain height from a Stackss node.
 * Used to check if BNS names are exired.
 */

export const getCurrentBlockNumber = (apiEndpoint: string) =>
  fetchJSON<{ stacks_tip_height: number }>(`${apiEndpoint}/v2/info`).pipe(
    map(prop('stacks_tip_height'))
  )
