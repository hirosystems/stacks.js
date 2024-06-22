import { BytesReader } from './bytesReader';
import { DeserializationError } from './errors';
import { PubKeyEncoding, RECOVERABLE_ECDSA_SIG_LENGTH_BYTES, StacksMessageType } from './constants';
import {
  compressPublicKey,
  deserializePublicKey,
  serializePublicKey,
  StacksPublicKey,
  uncompressPublicKey,
} from './keys';

import { createMessageSignature, MessageSignature } from './common';

// @ts-ignore
import { bytesToHex, concatArray, hexToBytes } from '@stacks/common';

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

// todo: `next` refactor to match wire format more precisely eg https://github.com/jbencin/sips/blob/sip-02x-non-sequential-multisig-transactions/sips/sip-02x/sip-02x-non-sequential-multisig-transactions.md
//  "A spending authorization field is encoded as follows:" ...
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

export function deserializeTransactionAuthField(bytesReader: BytesReader): TransactionAuthField {
  const authFieldType = bytesReader.readUInt8Enum(AuthFieldType, n => {
    throw new DeserializationError(`Could not read ${n} as AuthFieldType`);
  });

  switch (authFieldType) {
    case AuthFieldType.PublicKeyCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializePublicKey(bytesReader)
      );
    case AuthFieldType.PublicKeyUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        uncompressPublicKey(deserializePublicKey(bytesReader).data)
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

export function serializeMessageSignature(messageSignature: MessageSignature): Uint8Array {
  return hexToBytes(messageSignature.data);
}

export function serializeTransactionAuthField(field: TransactionAuthField): Uint8Array {
  const bytesArray = [];

  switch (field.contents.type) {
    case StacksMessageType.PublicKey:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.PublicKeyCompressed
          : AuthFieldType.PublicKeyUncompressed
      );
      bytesArray.push(serializePublicKey(compressPublicKey(field.contents.data)));
      break;
    case StacksMessageType.MessageSignature:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.SignatureCompressed
          : AuthFieldType.SignatureUncompressed
      );
      bytesArray.push(serializeMessageSignature(field.contents));
      break;
  }

  return concatArray(bytesArray);
}
