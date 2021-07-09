import { compose } from 'ramda'
import { hexToCV, cvToValue } from '@stacks/transactions'
import { stripHexPrefixIfPresent } from './'
import { BNS_ADDRESSES } from '../constants'
import { Left, Right, Either } from 'monet'
import { DidType, StacksV2DID } from '../types'
import { DIDResolutionError, DIDResolutionErrorCodes } from '../errors'

const hexToAscii = (hex: string) =>
  Buffer.from(stripHexPrefixIfPresent(hex), 'hex').toString('ascii')

type TransactionArguments = {
  name: string
  namespace: string
  zonefileHash: string
}

// TODO Differentiate between the different reasons for an invalid transaction
export const parseAndValidateTransaction =
  (did: StacksV2DID) =>
  (tx: any): Either<Error, TransactionArguments> => {
    const validDidInceptionEvents = {
      [DidType.offChain]: ['name-import', 'name-update'],
      [DidType.onChain]: ['name-register', 'name-import'],
    }

    if (tx.tx_status !== 'success') {
      return Left(
        new DIDResolutionError(
          DIDResolutionErrorCodes.InvalidAnchorTx,
          'Name anchor transaction status must be "success"'
        )
      )
    }

    const contractCallData = tx.contract_call

    if (!contractCallData) {
      return Left(
        new DIDResolutionError(
          DIDResolutionErrorCodes.InvalidAnchorTx,
          'Name anchor transaction must encode contract call'
        )
      )
    }

    if (!BNS_ADDRESSES[did.metadata.deployment] === contractCallData.contract_id) {
      return Left(
        new DIDResolutionError(
          DIDResolutionErrorCodes.InvalidAnchorTx,
          'Name anchor transaction must be destined to the BNS contract'
        )
      )
    }

    const calledFunction = contractCallData['function_name']

    if (!validDidInceptionEvents[did.metadata.type].includes(calledFunction)) {
      return Left(
        new DIDResolutionError(
          DIDResolutionErrorCodes.InvalidAnchorTx,
          'Name anchor transaction references invalid function call'
        )
      )
    }

    return extractContractCallArgs(contractCallData.function_args)
  }

/**
 * Extracts the namespace, name, and zonefile-hash arguments from a name-register / name-update TX
 * @returns nameInfo - the name, namespace, and zonefile-hash encoded in the TX
 * @todo Add specific error message for invalid anchor tx
 */

const extractContractCallArgs = (functionArgs: Array<any>): Either<Error, TransactionArguments> => {
  const relevantArguments = ['name', 'namespace', 'zonefile-hash']

  const {
    name,
    namespace,
    'zonefile-hash': zonefileHash,
  } = functionArgs.reduce((parsed, current) => {
    if (relevantArguments.includes(current.name)) {
      return { ...parsed, [current.name]: current.hex }
    }
    return parsed
  }, {})

  if (!name || !namespace || !zonefileHash) {
    return Left(
      new DIDResolutionError(
        DIDResolutionErrorCodes.InvalidAnchorTx,
        'Name anchor transaction does not include expected arguments'
      )
    )
  }

  const hexEncodedValues = [name, namespace, zonefileHash].map(
    compose(cvToValue, hexToCV, stripHexPrefixIfPresent)
  )

  const [nameArg, namespaceArg, zonefileHashArg] = hexEncodedValues

  return Right({
    name: hexToAscii(nameArg),
    namespace: hexToAscii(namespaceArg),
    zonefileHash:
      typeof zonefileHashArg === 'string'
        ? stripHexPrefixIfPresent(zonefileHashArg)
        : stripHexPrefixIfPresent(zonefileHashArg.value), // TODO Is this still the case?
  })
}
