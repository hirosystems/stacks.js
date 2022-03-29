import { Buffer } from './utils';

/**
 * @private
 * @ignore
 */
export function privateKeyToBuffer(privateKey: string | Buffer): Buffer {
  const privateKeyBuffer = Buffer.isBuffer(privateKey)
    ? privateKey
    : Buffer.from(privateKey, 'hex');

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
