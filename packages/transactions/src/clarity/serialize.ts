import {
  concatArray,
  concatBytes,
  bigIntToBytes,
  toTwos,
  writeUInt32BE,
  utf8ToBytes,
  asciiToBytes,
} from '@stacks/common';
import { serializeAddress, serializeLPString } from '../types';
import { createLPString } from '../postcondition-types';
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
  ClarityValue,
} from '.';
import { ClarityType } from './constants';

import { SerializationError } from '../errors';
import { StringAsciiCV, StringUtf8CV } from './types/stringCV';
import { CLARITY_INT_BYTE_SIZE, CLARITY_INT_SIZE } from '../constants';

function bytesWithTypeID(typeId: ClarityType, bytes: Uint8Array): Uint8Array {
  return concatArray([typeId, bytes]);
}

function serializeBoolCV(value: BooleanCV): Uint8Array {
  return new Uint8Array([value.type]);
}

function serializeOptionalCV(cv: OptionalCV): Uint8Array {
  if (cv.type === ClarityType.OptionalNone) {
    return new Uint8Array([cv.type]);
  } else {
    return bytesWithTypeID(cv.type, serializeCV(cv.value));
  }
}

function serializeBufferCV(cv: BufferCV): Uint8Array {
  const length = new Uint8Array(4);
  writeUInt32BE(length, cv.buffer.length, 0);
  return bytesWithTypeID(cv.type, concatBytes(length, cv.buffer));
}

function serializeIntCV(cv: IntCV): Uint8Array {
  const bytes = bigIntToBytes(toTwos(cv.value, BigInt(CLARITY_INT_SIZE)), CLARITY_INT_BYTE_SIZE);
  return bytesWithTypeID(cv.type, bytes);
}

function serializeUIntCV(cv: UIntCV): Uint8Array {
  const bytes = bigIntToBytes(cv.value, CLARITY_INT_BYTE_SIZE);
  return bytesWithTypeID(cv.type, bytes);
}

function serializeStandardPrincipalCV(cv: StandardPrincipalCV): Uint8Array {
  return bytesWithTypeID(cv.type, serializeAddress(cv.address));
}

function serializeContractPrincipalCV(cv: ContractPrincipalCV): Uint8Array {
  return bytesWithTypeID(
    cv.type,
    concatBytes(serializeAddress(cv.address), serializeLPString(cv.contractName))
  );
}

function serializeResponseCV(cv: ResponseCV) {
  return bytesWithTypeID(cv.type, serializeCV(cv.value));
}

function serializeListCV(cv: ListCV) {
  const bytesArray = [];

  const length = new Uint8Array(4);
  writeUInt32BE(length, cv.list.length, 0);
  bytesArray.push(length);

  for (const value of cv.list) {
    const serializedValue = serializeCV(value);
    bytesArray.push(serializedValue);
  }

  return bytesWithTypeID(cv.type, concatArray(bytesArray));
}

function serializeTupleCV(cv: TupleCV) {
  const bytesArray = [];

  const length = new Uint8Array(4);
  writeUInt32BE(length, Object.keys(cv.data).length, 0);
  bytesArray.push(length);

  const lexicographicOrder = Object.keys(cv.data).sort((a, b) => a.localeCompare(b));

  for (const key of lexicographicOrder) {
    const nameWithLength = createLPString(key);
    bytesArray.push(serializeLPString(nameWithLength));

    const serializedValue = serializeCV(cv.data[key]);
    bytesArray.push(serializedValue);
  }

  return bytesWithTypeID(cv.type, concatArray(bytesArray));
}

function serializeStringCV(cv: StringAsciiCV | StringUtf8CV, encoding: 'ascii' | 'utf8') {
  const bytesArray = [];

  const str = encoding == 'ascii' ? asciiToBytes(cv.data) : utf8ToBytes(cv.data);
  const len = new Uint8Array(4);
  writeUInt32BE(len, str.length, 0);

  bytesArray.push(len);
  bytesArray.push(str);

  return bytesWithTypeID(cv.type, concatArray(bytesArray));
}

function serializeStringAsciiCV(cv: StringAsciiCV) {
  return serializeStringCV(cv, 'ascii');
}

function serializeStringUtf8CV(cv: StringUtf8CV) {
  return serializeStringCV(cv, 'utf8');
}

/**
 * Serializes clarity value to Uint8Array
 *
 * @param {ClarityValue} value to be converted to bytes
 **
 * @returns {Uint8Array} returns the bytes
 *
 * @example
 * ```
 *  import { intCV, serializeCV } from '@stacks/transactions';
 *
 *  const serialized = serializeCV(intCV(100)); // Similarly works for other clarity types as well like listCV, booleanCV ...
 *
 *  // <Uint8Array 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 64>
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
export function serializeCV(value: ClarityValue): Uint8Array {
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
