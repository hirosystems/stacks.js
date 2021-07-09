import { Right, Left, Either } from 'monet'
import { verifyProfileToken } from '@stacks/profile/dist'
import { fetchSignedToken } from '../api'
import { eitherToFuture, toMainnetAddress } from './'
import { chain, map } from 'fluture'
import { DIDResolutionError, DIDResolutionErrorCodes } from '../errors'

/**
 * @param {string} tokenUrl - HTTP(S) url, get request to this url should return a signed JWT
 * @param {string} ownerAddress - c32 encoded Stacks address
 */
export const fetchAndVerifySignedToken = (tokenUrl: string, ownerAddress: string) =>
  fetchSignedToken(tokenUrl)
    .pipe(map(verifyTokenAndGetPubKey(ownerAddress)))
    .pipe(chain(eitherToFuture))

const verifyTokenAndGetPubKey =
  (owner: string) =>
  ({ token }: { token: string }): Either<Error, string> => {
    try {
      const { payload } = verifyProfileToken(token, toMainnetAddress(owner))
      //@ts-ignore
      return Right(payload.subject.publicKey)
    } catch (e) {
      return Left(
        new DIDResolutionError(DIDResolutionErrorCodes.InvalidSignedProfileToken, e.message)
      )
    }
  }
