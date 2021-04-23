// @ts-ignore
import { Buffer } from '@stacks/common';
import randombytes from 'randombytes';

export { randombytes as randomBytes };

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Buffer;
