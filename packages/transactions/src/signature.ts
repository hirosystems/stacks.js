import { bytesToHex, concatArray, hexToBytes, isInstance } from '@stacks/common';
import { BytesReader } from './bytesReader';
import { MessageSignature, createMessageSignature } from './common';
import { PubKeyEncoding, RECOVERABLE_ECDSA_SIG_LENGTH_BYTES, StacksWireType } from './constants';
import { DeserializationError } from './errors';
import {
  StacksPublicKey,
  compressPublicKey,
  createStacksPublicKey,
  deserializePublicKeyBytes,
  uncompressPublicKey,
} from './keys';

export enum AuthFieldType {
  PublicKeyCompressed = 0x00,
  PublicKeyUncompressed = 0x01,
  SignatureCompressed = 0x02,
  SignatureUncompressed = 0x03,
}

export interface TransactionAuthField {
  type: StacksWireType.TransactionAuthField;
  pubKeyEncoding: PubKeyEncoding;
  contents: TransactionAuthFieldContents;
}

export type TransactionAuthFieldContents = StacksPublicKey | MessageSignature;

export function deserializeMessageSignature(serialized: string): MessageSignature {
  return deserializeMessageSignatureBytes(hexToBytes(serialized));
}
/** @ignore */
export function deserializeMessageSignatureBytes(
  serialized: Uint8Array | BytesReader
): MessageSignature {
  const bytesReader = isInstance(serialized, BytesReader)
    ? serialized
    : new BytesReader(serialized);
  return createMessageSignature(
    bytesToHex(bytesReader.readBytes(RECOVERABLE_ECDSA_SIG_LENGTH_BYTES))
  );
}

// todo: `next` refactor to match wire format more precisely eg https://github.com/jbencin/sips/blob/sip-02x-non-sequential-multisig-transactions/sips/sip-02x/sip-02x-non-sequential-multisig-transactions.md
//  "A spending authorization field is encoded as follows:" ...
export interface TransactionAuthField {
  type: StacksWireType.TransactionAuthField;
  pubKeyEncoding: PubKeyEncoding;
  contents: TransactionAuthFieldContents;
}

export function createTransactionAuthField(
  pubKeyEncoding: PubKeyEncoding,
  contents: TransactionAuthFieldContents
): TransactionAuthField {
  return {
    pubKeyEncoding,
    type: StacksWireType.TransactionAuthField,
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
        createStacksPublicKey(uncompressPublicKey(deserializePublicKeyBytes(bytesReader).data))
      );
    case AuthFieldType.SignatureCompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Compressed,
        deserializeMessageSignatureBytes(bytesReader)
      );
    case AuthFieldType.SignatureUncompressed:
      return createTransactionAuthField(
        PubKeyEncoding.Uncompressed,
        deserializeMessageSignatureBytes(bytesReader)
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
    case StacksWireType.PublicKey:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.PublicKeyCompressed
          : AuthFieldType.PublicKeyUncompressed
      );
      bytesArray.push(hexToBytes(compressPublicKey(field.contents.data)));
      break;
    case StacksWireType.MessageSignature:
      bytesArray.push(
        field.pubKeyEncoding === PubKeyEncoding.Compressed
          ? AuthFieldType.SignatureCompressed
          : AuthFieldType.SignatureUncompressed
      );
      bytesArray.push(serializeMessageSignatureBytes(field.contents));
      break;
  }

  return concatArray(bytesArray);
}
