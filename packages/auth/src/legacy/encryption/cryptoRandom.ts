import * as randombytes from 'randombytes'

export { randombytes as randomBytes }

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Buffer

