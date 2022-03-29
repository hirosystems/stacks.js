import { Buffer } from '@stacks/common';
import { utils } from '@noble/secp256k1';

/**
 * Use utils.randomBytes to replace randombytes dependency
 * Generates a buffer with random bytes of given length
 * @param {bytesLength} an optional bytes length, default is 32 bytes
 * @return {Buffer} For return type compatibility converting utils.randomBytes return value to buffer
 */
export const randomBytes = (bytesLength?: number) => Buffer.from(utils.randomBytes(bytesLength));

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Buffer;
