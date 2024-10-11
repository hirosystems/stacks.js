import { hexToBytes } from './utils';

export type PrivateKey = string | Uint8Array;
export type PublicKey = string | Uint8Array;

/**
 * @private
 * @ignore
 */
export function privateKeyToBytes(privateKey: PrivateKey): Uint8Array {
  const privateKeyBuffer = typeof privateKey === 'string' ? hexToBytes(privateKey) : privateKey;

  if (privateKeyBuffer.length != 32 && privateKeyBuffer.length != 33) {
    throw new Error(
      `Improperly formatted private-key. Private-key byte length should be 32 or 33. Length provided: ${privateKeyBuffer.length}`
    );
  }

  if (privateKeyBuffer.length == 33 && privateKeyBuffer[32] !== 1) {
    throw new Error(
      'Improperly formatted private-key. 33 bytes indicate compressed key, but the last byte must be == 01'
    );
  }

  return privateKeyBuffer;
}
