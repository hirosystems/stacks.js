import { ripemd160 } from '@noble/hashes/ripemd160';

export function hashRipemd160(data: Uint8Array) {
  return ripemd160(data);
}
