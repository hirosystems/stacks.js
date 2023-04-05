import { utils } from '@noble/secp256k1';

/**
 * Reexports @noble/secp256k1's `randomBytes`.
 * Generates bytes with random bytes of given length
 * @param bytesLength an optional bytes length, default `32`
 * @return {Uint8Array} random bytes
 */
export const randomBytes = (bytesLength: number = 32): Uint8Array => utils.randomBytes(bytesLength);

/**
 * Reexports @noble/secp256k1's `randomPrivateKey`.
 * Generates a random scalar between 0 and the group prime for secp256k1
 * @returns {Uint8Array} random private key
 */
export const randomPrivateKey = (): Uint8Array => utils.randomPrivateKey();

/** Optional function to generate cryptographically secure random bytes */
export type GetRandomBytes = (count: number) => Uint8Array;
