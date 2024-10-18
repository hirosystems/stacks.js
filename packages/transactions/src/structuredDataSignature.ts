import { sha256 } from '@noble/hashes/sha256';
import { PrivateKey, bytesToHex, concatBytes, hexToBytes } from '@stacks/common';
import { ClarityType, ClarityValue, serializeCVBytes } from './clarity';
import { signMessageHashRsv } from './keys';

// Refer to SIP018 https://github.com/stacksgov/sips/
// > asciiToBytes('SIP018')
export const STRUCTURED_DATA_PREFIX = new Uint8Array([0x53, 0x49, 0x50, 0x30, 0x31, 0x38]);

export function hashStructuredData(structuredData: ClarityValue): string {
  return bytesToHex(sha256(serializeCVBytes(structuredData)));
}

export function hashStructuredDataBytes(structuredData: ClarityValue): Uint8Array {
  return sha256(serializeCVBytes(structuredData));
}

const hash256BytesLength = 32;

function isDomain(value: ClarityValue): boolean {
  if (value.type !== ClarityType.Tuple) return false;
  // Check that the tuple has at least 'name', 'version' and 'chain-id'
  if (!['name', 'version', 'chain-id'].every(key => key in value.value)) return false;
  // Check each key is of the right type
  if (!['name', 'version'].every(key => value.value[key].type === ClarityType.StringASCII))
    return false;

  if (value.value['chain-id'].type !== ClarityType.UInt) return false;
  return true;
}

export function encodeStructuredData(opts: {
  message: ClarityValue;
  domain: ClarityValue;
}): string {
  const bytes = encodeStructuredDataBytes(opts);
  return bytesToHex(bytes);
}

export function encodeStructuredDataBytes({
  message,
  domain,
}: {
  message: ClarityValue;
  domain: ClarityValue;
}): Uint8Array {
  const structuredDataHash: Uint8Array = hashStructuredDataBytes(message);
  if (!isDomain(domain)) {
    throw new Error(
      "domain parameter must be a valid domain of type TupleCV with keys 'name', 'version', 'chain-id' with respective types StringASCII, StringASCII, UInt"
    );
  }
  const domainHash: Uint8Array = hashStructuredDataBytes(domain);

  return concatBytes(STRUCTURED_DATA_PREFIX, domainHash, structuredDataHash);
}

export function decodeStructuredDataSignature(signature: string | Uint8Array): {
  domainHash: string;
  messageHash: string;
} {
  const bytes = decodeStructuredDataSignatureBytes(signature);
  return {
    domainHash: bytesToHex(bytes.domainHash),
    messageHash: bytesToHex(bytes.messageHash),
  };
}

export function decodeStructuredDataSignatureBytes(signature: string | Uint8Array): {
  domainHash: Uint8Array;
  messageHash: Uint8Array;
} {
  const encodedMessageBytes: Uint8Array =
    typeof signature === 'string' ? hexToBytes(signature) : signature;
  const domainHash = encodedMessageBytes.slice(
    STRUCTURED_DATA_PREFIX.length,
    STRUCTURED_DATA_PREFIX.length + hash256BytesLength
  );
  const messageHash = encodedMessageBytes.slice(STRUCTURED_DATA_PREFIX.length + hash256BytesLength);
  return {
    domainHash,
    messageHash,
  };
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
  privateKey: PrivateKey;
}): string {
  const structuredDataHash = bytesToHex(sha256(encodeStructuredDataBytes({ message, domain })));

  return signMessageHashRsv({
    messageHash: structuredDataHash,
    privateKey,
  });
}
