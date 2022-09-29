import { sha256 } from '@noble/hashes/sha256';
import { Buffer } from '@stacks/common';
import { decode, encode, encodingLength } from 'varuint-bitcoin';

// 'Stacks Message Signing:\n'.length //  = 24
// 'Stacks Message Signing:\n'.length.toString(16) //  = 18
const chainPrefix: string = '\x18Stacks Message Signing:\n';

export function hashMessage(message: string, prefix: string = chainPrefix): Buffer {
  return Buffer.from(sha256(encodeMessage(message, prefix)));
}

export function encodeMessage(message: string | Buffer, prefix: string = chainPrefix): Buffer {
  const encoded = encode(Buffer.from(message).length);
  return Buffer.concat([Buffer.from(prefix), encoded, Buffer.from(message)]);
}

export function decodeMessage(encodedMessage: Buffer, prefix: string = chainPrefix): Buffer {
  const prefixByteLength = Buffer.from(prefix).byteLength;
  const messageWithoutChainPrefix = encodedMessage.subarray(prefixByteLength);
  const decoded = decode(messageWithoutChainPrefix);
  const varIntLength = encodingLength(decoded);
  // Remove the varint prefix
  return messageWithoutChainPrefix.slice(varIntLength);
}
