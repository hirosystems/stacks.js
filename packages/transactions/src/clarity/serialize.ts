import { Buffer } from '@stacks/common';
import { serializeAddress, serializeLPString, createLPString } from '../types';
import {
  BooleanCV,
  OptionalCV,
  BufferCV,
  IntCV,
  UIntCV,
  StandardPrincipalCV,
  ContractPrincipalCV,
  ResponseCV,
  ListCV,
  TupleCV,
  ClarityType,
  ClarityValue,
} from '.';
import { BufferArray } from '../utils';
import { SerializationError } from '../errors';
import { StringAsciiCV, StringUtf8CV } from './types/stringCV';
import { CLARITY_INT_BYTE_SIZE, CLARITY_INT_SIZE } from '../constants';
import BN from 'bn.js';

function bufferWithTypeID(typeId: ClarityType, buffer: Buffer): Buffer {
  const id = Buffer.from([typeId]);
  return Buffer.concat([id, buffer]);
}

function serializeBoolCV(value: BooleanCV): Buffer {
  return Buffer.from([value.type]);
}

function serializeOptionalCV(cv: OptionalCV): Buffer {
  if (cv.type === ClarityType.OptionalNone) {
    return Buffer.from([cv.type]);
  } else {
    return bufferWithTypeID(cv.type, serializeCV(cv.value));
  }
}

function serializeBufferCV(cv: BufferCV): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(cv.buffer.length, 0);
  return bufferWithTypeID(cv.type, Buffer.concat([length, cv.buffer]));
}

function serializeIntCV(cv: IntCV): Buffer {
  const buffer = new BN(cv.value.toString())
    .toTwos(CLARITY_INT_SIZE)
    .toArrayLike(Buffer, 'be', CLARITY_INT_BYTE_SIZE);
  return bufferWithTypeID(cv.type, buffer);
}

function serializeUIntCV(cv: UIntCV): Buffer {
  const buffer = new BN(cv.value.toString()).toArrayLike(Buffer, 'be', CLARITY_INT_BYTE_SIZE);
  return bufferWithTypeID(cv.type, buffer);
}

function serializeStandardPrincipalCV(cv: StandardPrincipalCV): Buffer {
  return bufferWithTypeID(cv.type, serializeAddress(cv.address));
}

function serializeContractPrincipalCV(cv: ContractPrincipalCV): Buffer {
  return bufferWithTypeID(
    cv.type,
    Buffer.concat([serializeAddress(cv.address), serializeLPString(cv.contractName)])
  );
}

function serializeResponseCV(cv: ResponseCV) {
  return bufferWithTypeID(cv.type, serializeCV(cv.value));
}

function serializeListCV(cv: ListCV) {
  const buffers = new BufferArray();

  const length = Buffer.alloc(4);
  length.writeUInt32BE(cv.list.length, 0);
  buffers.push(length);

  for (const value of cv.list) {
    const serializedValue = serializeCV(value);
    buffers.push(serializedValue);
  }

  return bufferWithTypeID(cv.type, buffers.concatBuffer());
}

function serializeTupleCV(cv: TupleCV) {
  const buffers = new BufferArray();

  const length = Buffer.alloc(4);
  length.writeUInt32BE(Object.keys(cv.data).length, 0);
  buffers.push(length);

  const lexicographicOrder = Object.keys(cv.data).sort((a, b) => {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.compare(bufB);
  });

  for (const key of lexicographicOrder) {
    const nameWithLength = createLPString(key);
    buffers.push(serializeLPString(nameWithLength));

    const serializedValue = serializeCV(cv.data[key]);
    buffers.push(serializedValue);
  }

  return bufferWithTypeID(cv.type, buffers.concatBuffer());
}

function serializeStringCV(cv: StringAsciiCV | StringUtf8CV, encoding: 'ascii' | 'utf8') {
  const buffers = new BufferArray();

  const str = Buffer.from(cv.data, encoding);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(str.length, 0);

  buffers.push(len);
  buffers.push(str);

  return bufferWithTypeID(cv.type, buffers.concatBuffer());
}

function serializeStringAsciiCV(cv: StringAsciiCV) {
  return serializeStringCV(cv, 'ascii');
}

function serializeStringUtf8CV(cv: StringUtf8CV) {
  return serializeStringCV(cv, 'utf8');
}

export function serializeCV(value: ClarityValue): Buffer {
  switch (value.type) {
    case ClarityType.BoolTrue:
    case ClarityType.BoolFalse:
      return serializeBoolCV(value);
    case ClarityType.OptionalNone:
    case ClarityType.OptionalSome:
      return serializeOptionalCV(value);
    case ClarityType.Buffer:
      return serializeBufferCV(value);
    case ClarityType.UInt:
      return serializeUIntCV(value);
    case ClarityType.Int:
      return serializeIntCV(value);
    case ClarityType.PrincipalStandard:
      return serializeStandardPrincipalCV(value);
    case ClarityType.PrincipalContract:
      return serializeContractPrincipalCV(value);
    case ClarityType.ResponseOk:
    case ClarityType.ResponseErr:
      return serializeResponseCV(value);
    case ClarityType.List:
      return serializeListCV(value);
    case ClarityType.Tuple:
      return serializeTupleCV(value);
    case ClarityType.StringASCII:
      return serializeStringAsciiCV(value);
    case ClarityType.StringUTF8:
      return serializeStringUtf8CV(value);
    default:
      throw new SerializationError('Unable to serialize. Invalid Clarity Value.');
  }
}
