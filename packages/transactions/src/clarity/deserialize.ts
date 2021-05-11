import { Buffer } from '@stacks/common';
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
import { BufferReader } from '../bufferReader';
import { deserializeAddress, deserializeLPString } from '../types';
import { DeserializationError } from '../errors';
import { stringAsciiCV, stringUtf8CV } from './types/stringCV';

export default function deserializeCV<T extends ClarityValue = ClarityValue>(
  serializedClarityValue: BufferReader | Buffer | string
): T {
  let bufferReader: BufferReader;
  if (typeof serializedClarityValue === 'string') {
    const hasHexPrefix = serializedClarityValue.slice(0, 2).toLowerCase() === '0x';
    bufferReader = new BufferReader(
      Buffer.from(hasHexPrefix ? serializedClarityValue.slice(2) : serializedClarityValue, 'hex')
    );
  } else if (Buffer.isBuffer(serializedClarityValue)) {
    bufferReader = new BufferReader(serializedClarityValue);
  } else {
    bufferReader = serializedClarityValue;
  }
  const type = bufferReader.readUInt8Enum(ClarityType, n => {
    throw new DeserializationError(`Cannot recognize Clarity Type: ${n}`);
  });

  switch (type) {
    case ClarityType.Int:
      return intCV(bufferReader.readBuffer(16)) as T;

    case ClarityType.UInt:
      return uintCV(bufferReader.readBuffer(16)) as T;

    case ClarityType.Buffer:
      const bufferLength = bufferReader.readUInt32BE();
      return bufferCV(bufferReader.readBuffer(bufferLength)) as T;

    case ClarityType.BoolTrue:
      return trueCV() as T;

    case ClarityType.BoolFalse:
      return falseCV() as T;

    case ClarityType.PrincipalStandard:
      const sAddress = deserializeAddress(bufferReader);
      return standardPrincipalCVFromAddress(sAddress) as T;

    case ClarityType.PrincipalContract:
      const cAddress = deserializeAddress(bufferReader);
      const contractName = deserializeLPString(bufferReader);
      return contractPrincipalCVFromAddress(cAddress, contractName) as T;

    case ClarityType.ResponseOk:
      return responseOkCV(deserializeCV(bufferReader)) as T;

    case ClarityType.ResponseErr:
      return responseErrorCV(deserializeCV(bufferReader)) as T;

    case ClarityType.OptionalNone:
      return noneCV() as T;

    case ClarityType.OptionalSome:
      return someCV(deserializeCV(bufferReader)) as T;

    case ClarityType.List:
      const listLength = bufferReader.readUInt32BE();
      const listContents: ClarityValue[] = [];
      for (let i = 0; i < listLength; i++) {
        listContents.push(deserializeCV(bufferReader));
      }
      return listCV(listContents) as T;

    case ClarityType.Tuple:
      const tupleLength = bufferReader.readUInt32BE();
      const tupleContents: { [key: string]: ClarityValue } = {};
      for (let i = 0; i < tupleLength; i++) {
        const clarityName = deserializeLPString(bufferReader).content;
        if (clarityName === undefined) {
          throw new DeserializationError('"content" is undefined');
        }
        tupleContents[clarityName] = deserializeCV(bufferReader);
      }
      return tupleCV(tupleContents) as T;

    case ClarityType.StringASCII:
      const asciiStrLen = bufferReader.readUInt32BE();
      const asciiStr = bufferReader.readBuffer(asciiStrLen).toString('ascii');
      return stringAsciiCV(asciiStr) as T;

    case ClarityType.StringUTF8:
      const utf8StrLen = bufferReader.readUInt32BE();
      const utf8Str = bufferReader.readBuffer(utf8StrLen).toString('utf8');
      return stringUtf8CV(utf8Str) as T;

    default:
      throw new DeserializationError(
        'Unable to deserialize Clarity Value from buffer. Could not find valid Clarity Type.'
      );
  }
}
