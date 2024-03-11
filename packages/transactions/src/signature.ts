import { BytesReader } from './bytesReader';
import { DeserializationError } from './errors';
import { PubKeyEncoding, RECOVERABLE_ECDSA_SIG_LENGTH_BYTES, StacksMessageType } from './constants';
import {
  compressPublicKey,
  deserializePublicKeyBytes,
  serializePublicKeyBytes,
  StacksPublicKey,
} from './keys';

import { createMessageSignature, MessageSignature } from './common';

// @ts-ignore
import { bytesToHex, concatArray, hexToBytes, isInstance } from '@stacks/common';

export enum AuthFieldType {
  PublicKeyCompressed = 0x00,
  PublicKeyUncompressed = 0x01,
  SignatureCompressed = 0x02,
  SignatureUncompressed = 0x03,
}

export interface TransactionAuthField {
  type: StacksMessageType.TransactionAuthField;
  pubKeyEncoding: PubKeyEncoding;
  contents: TransactionAuthFieldContents;
}

export type TransactionAuthFieldContents = StacksPublicKey | MessageSignature;

export function deserializeMessageSignature(bytesReader: BytesReader): MessageSignature {
  return createMessageSignature(
    bytesToHex(bytesReader.readBytes(RECOVERABLE_ECDSA_SIG_LENGTH_BYTES))
  );
}

export interface TransactionAuthField {
  type: StacksMessageType.TransactionAuthField;
  pubKeyEncoding: PubKeyEncoding;
  contents: TransactionAuthFieldContents;
}

export function createTransactionAuthField(
  pubKeyEncoding: PubKeyEncoding,
  contents: TransactionAuthFieldContents
): TransactionAuthField {
  return {
    pubKeyEncoding,
    type: StacksMessageType.TransactionAuthField,
    contents,
  };
}

export function deserializeTransactionAuthField(serialized: string): TransactionAuthField {
  return deserializeTransactionAuthFieldBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeTransactionAuthFieldBytes(
  serialized: Uint8Array | BytesReader
): TransactionAuthField {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  const authFieldType = bytesReader.readUInt8Enum(AuthFieldType, n => {
    throw new DeserializationError(`Could not read ${n} as AuthFieldType`);
  });

  switch (authFieldType) {
    case AuthFieldType.PublicKeyCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializePublicKeyBytes(bytesReader)
      );
    case AuthFieldType.PublicKeyUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        deserializePublicKeyBytes(bytesReader)
      );
    case AuthFieldType.SignatureCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializeMessageSignature(bytesReader)
      );
    case AuthFieldType.SignatureUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        deserializeMessageSignature(bytesReader)
      );
    default:
      throw new Error(`Unknown auth field type: ${JSON.stringify(authFieldType)}`);
  }
}

export function serializeMessageSignature(messageSignature: MessageSignature): string {
  return bytesToHex(serializeMessageSignatureBytes(messageSignature));
}
/** @ignore */
export function serializeMessageSignatureBytes(messageSignature: MessageSignature): Uint8Array {
  return hexToBytes(messageSignature.data);
}

export function serializeTransactionAuthField(field: TransactionAuthField): string {
  return bytesToHex(serializeTransactionAuthFieldBytes(field));
}
/** @ignore */
export function serializeTransactionAuthFieldBytes(field: TransactionAuthField): Uint8Array {
  const bytesArray = [];

  switch (field.contents.type) {
    case StacksMessageType.PublicKey:
      if (field.pubKeyEncoding == PubKeyEncoding.Compressed) {
        bytesArray.push(AuthFieldType.PublicKeyCompressed);
        bytesArray.push(serializePublicKeyBytes(field.contents));
      } else {
        bytesArray.push(AuthFieldType.PublicKeyUncompressed);
        bytesArray.push(hexToBytes(compressPublicKey(field.contents.data)));
      }
      break;
    case StacksMessageType.MessageSignature:
      if (field.pubKeyEncoding == PubKeyEncoding.Compressed) {
        bytesArray.push(AuthFieldType.SignatureCompressed);
      } else {
        bytesArray.push(AuthFieldType.SignatureUncompressed);
      }
      bytesArray.push(serializeMessageSignatureBytes(field.contents));
      break;
  }

  return concatArray(bytesArray);
}
