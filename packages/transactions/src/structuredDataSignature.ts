import { sha256 } from '@noble/hashes/sha256';
import { Buffer } from '@stacks/common';
import { ClarityType, ClarityValue, serializeCV } from './clarity';
import { StacksMessageType } from './constants';
import { signMessageHashRsv, StacksPrivateKey } from './keys';

// Refer to SIP018 https://github.com/stacksgov/sips/
export const STRUCTURED_DATA_PREFIX = Buffer.from('SIP018', 'ascii');

export function hashStructuredData(structuredData: ClarityValue): Buffer {
  return Buffer.from(sha256(serializeCV(structuredData)));
}

const hash256BytesLength = 32;

function isDomain(value: ClarityValue): boolean {
  if (value.type !== ClarityType.Tuple) return false;
  // Check that the tuple has at least 'name', 'version' and 'chain-id'
  if (!['name', 'version', 'chain-id'].every(key => key in value.data)) return false;
  // Check each key is of the right type
  if (!['name', 'version'].every(key => value.data[key].type === ClarityType.StringASCII))
    return false;

  if (value.data['chain-id'].type !== ClarityType.UInt) return false;
  return true;
}

export function encodeStructuredData({
  message,
  domain,
}: {
  message: ClarityValue;
  domain: ClarityValue;
}): Buffer {
  const structuredDataHash: Buffer = hashStructuredData(message);
  if (!isDomain(domain)) {
    throw new Error(
      "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id' with respective types StringASCII, StringASCII, UInt"
    );
  }
  const domainHash: Buffer = hashStructuredData(domain);

  return Buffer.concat([STRUCTURED_DATA_PREFIX, domainHash, structuredDataHash]);
}

export type DecodedStructuredData = {
  domainHash: Buffer;
  messageHash: Buffer;
};

export function decodeStructuredDataSignature(signature: string | Buffer): DecodedStructuredData {
  const encodedMessageBuffer: Buffer = Buffer.from(signature);
  const domainHash = encodedMessageBuffer.slice(
    STRUCTURED_DATA_PREFIX.length,
    STRUCTURED_DATA_PREFIX.length + hash256BytesLength
  );
  const messageHash = encodedMessageBuffer.slice(
    STRUCTURED_DATA_PREFIX.length + hash256BytesLength
  );
  return {
    domainHash,
    messageHash,
  };
}

export interface StructuredDataSignature {
  readonly type: StacksMessageType.StructuredDataSignature;
  data: string;
}

/**
 * Signs a structured message (ClarityValue) and a domain (ClarityValue) using a private key.
 * The resulting signature along with the original message can be verified using {@link verifyMessageSignature}
 * @returns A recoverable signature (in RSV order)
 */
export function signStructuredData({
  message,
  domain,
  privateKey,
}: {
  message: ClarityValue;
  domain: ClarityValue;
  privateKey: StacksPrivateKey;
}): StructuredDataSignature {
  const structuredDataHash: string = Buffer.from(
    sha256(encodeStructuredData({ message, domain }))
  ).toString('hex');

  const { data } = signMessageHashRsv({
    messageHash: structuredDataHash,
    privateKey,
  });
  return {
    data,
    type: StacksMessageType.StructuredDataSignature,
  };
}
