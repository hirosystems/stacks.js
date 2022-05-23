import { sha256 } from '@noble/hashes/sha256';
import { Buffer } from '@stacks/common';
import { decode, encode, encodingLength } from 'varuint-bitcoin';

// 'Stacks Message Signing:\n'.length //  = 24
// 'Stacks Message Signing:\n'.length.toString(16) //  = 18
const chainPrefix = '\x18Stacks Message Signing:\n';

export function hashMessage(message: string): Buffer {
  return Buffer.from(sha256(encodeMessage(message)));
}

export function encodeMessage(message: string | Buffer): Buffer {
  const encoded = encode(Buffer.from(message).length);
  return Buffer.concat([Buffer.from(chainPrefix), encoded, Buffer.from(message)]);
}

export function decodeMessage(encodedMessage: Buffer): Buffer {
  // Remove the chain prefix: 1 for the varint and 24 for the length of the string
  // 'Stacks Message Signing:\n'
  const messageWithoutChainPrefix = encodedMessage.subarray(1 + 24);
  const decoded = decode(messageWithoutChainPrefix);
  const varIntLength = encodingLength(decoded);
  // Remove the varint prefix
  return messageWithoutChainPrefix.slice(varIntLength);
}
