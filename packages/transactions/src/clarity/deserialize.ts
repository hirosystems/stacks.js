import {
  ClarityType,
  ClarityValue,
  intCV,
  uintCV,
  bufferCV,
  trueCV,
  falseCV,
  standardPrincipalCVFromAddress,
  contractPrincipalCVFromAddress,
  responseOkCV,
  responseErrorCV,
  noneCV,
  someCV,
  listCV,
  tupleCV,
} from '.';
import { BytesReader as BytesReader } from '../bytesReader';
import { deserializeAddress, deserializeLPString } from '../types';
import { DeserializationError } from '../errors';
import { stringAsciiCV, stringUtf8CV } from './types/stringCV';
import { bytesToAscii, bytesToUtf8, hexToBytes } from '@stacks/common';

/**
 * Deserializes clarity value to clarity type
 *
 * @param {value} Uint8Array | string value to be converted to clarity type
 **
 * @returns {ClarityType} returns the clarity type instance
 *
 * @example
 * ```
 *  import { intCV, serializeCV, deserializeCV } from '@stacks/transactions';
 *
 *  const serialized = serializeCV(intCV(100)); // Similarly works for other clarity types as well like listCV, booleanCV ...
 *
 *  // <Uint8Array 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 64>
 *
 *  const deserialized = deserializeCV(serialized);
 *  // { type: 0, value: 100n }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
export default function deserializeCV<T extends ClarityValue = ClarityValue>(
  serializedClarityValue: BytesReader | Uint8Array | string
): T {
  let bytesReader: BytesReader;
  if (typeof serializedClarityValue === 'string') {
    const hasHexPrefix = serializedClarityValue.slice(0, 2).toLowerCase() === '0x';
    bytesReader = new BytesReader(
      hexToBytes(hasHexPrefix ? serializedClarityValue.slice(2) : serializedClarityValue)
    );
  } else if (serializedClarityValue instanceof Uint8Array) {
    bytesReader = new BytesReader(serializedClarityValue);
  } else {
    bytesReader = serializedClarityValue;
  }
  const type = bytesReader.readUInt8Enum(ClarityType, n => {
    throw new DeserializationError(`Cannot recognize Clarity Type: ${n}`);
  });

  switch (type) {
    case ClarityType.Int:
      return intCV(bytesReader.readBytes(16)) as T;

    case ClarityType.UInt:
      return uintCV(bytesReader.readBytes(16)) as T;

    case ClarityType.Buffer:
      const bufferLength = bytesReader.readUInt32BE();
      return bufferCV(bytesReader.readBytes(bufferLength)) as T;

    case ClarityType.BoolTrue:
      return trueCV() as T;

    case ClarityType.BoolFalse:
      return falseCV() as T;

    case ClarityType.PrincipalStandard:
      const sAddress = deserializeAddress(bytesReader);
      return standardPrincipalCVFromAddress(sAddress) as T;

    case ClarityType.PrincipalContract:
      const cAddress = deserializeAddress(bytesReader);
      const contractName = deserializeLPString(bytesReader);
      return contractPrincipalCVFromAddress(cAddress, contractName) as T;

    case ClarityType.ResponseOk:
      return responseOkCV(deserializeCV(bytesReader)) as T;

    case ClarityType.ResponseErr:
      return responseErrorCV(deserializeCV(bytesReader)) as T;

    case ClarityType.OptionalNone:
      return noneCV() as T;

    case ClarityType.OptionalSome:
      return someCV(deserializeCV(bytesReader)) as T;

    case ClarityType.List:
      const listLength = bytesReader.readUInt32BE();
      const listContents: ClarityValue[] = [];
      for (let i = 0; i < listLength; i++) {
        listContents.push(deserializeCV(bytesReader));
      }
      return listCV(listContents) as T;

    case ClarityType.Tuple:
      const tupleLength = bytesReader.readUInt32BE();
      const tupleContents: { [key: string]: ClarityValue } = {};
      for (let i = 0; i < tupleLength; i++) {
        const clarityName = deserializeLPString(bytesReader).content;
        if (clarityName === undefined) {
          throw new DeserializationError('"content" is undefined');
        }
        tupleContents[clarityName] = deserializeCV(bytesReader);
      }
      return tupleCV(tupleContents) as T;

    case ClarityType.StringASCII:
      const asciiStrLen = bytesReader.readUInt32BE();
      const asciiStr = bytesToAscii(bytesReader.readBytes(asciiStrLen));
      return stringAsciiCV(asciiStr) as T;

    case ClarityType.StringUTF8:
      const utf8StrLen = bytesReader.readUInt32BE();
      const utf8Str = bytesToUtf8(bytesReader.readBytes(utf8StrLen));
      return stringUtf8CV(utf8Str) as T;

    default:
      throw new DeserializationError(
        'Unable to deserialize Clarity Value from Uint8Array. Could not find valid Clarity Type.'
      );
  }
}
