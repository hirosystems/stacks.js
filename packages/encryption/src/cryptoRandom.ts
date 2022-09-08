import { utils } from '@noble/secp256k1';

/**
 * Reexports @noble/secp256k1's randombytes
 * Generates bytes with random bytes of given length
 * @param bytesLength an optional bytes length, default `32` bytes
 * @return {Uint8Array} random bytes
 */
export const randomBytes = (bytesLength: number = 32): Uint8Array => utils.randomBytes(bytesLength);

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Uint8Array;
