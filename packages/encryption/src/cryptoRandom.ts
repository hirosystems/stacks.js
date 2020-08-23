import * as randombytes_ from 'randombytes'

let randombytes = randombytes_

export { randombytes as randomBytes }

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Buffer

