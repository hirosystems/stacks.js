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

export default function deserializeCV(buffer: BufferReader | Buffer): ClarityValue {
  const bufferReader = Buffer.isBuffer(buffer) ? new BufferReader(buffer) : buffer;
  const type = bufferReader.readUInt8Enum(ClarityType, n => {
    throw new DeserializationError(`Cannot recognize Clarity Type: ${n}`);
  });

  switch (type) {
    case ClarityType.Int:
      return intCV(bufferReader.readBuffer(16));

    case ClarityType.UInt:
      return uintCV(bufferReader.readBuffer(16));

    case ClarityType.Buffer:
      const bufferLength = bufferReader.readUInt32BE();
      return bufferCV(bufferReader.readBuffer(bufferLength));

    case ClarityType.BoolTrue:
      return trueCV();

    case ClarityType.BoolFalse:
      return falseCV();

    case ClarityType.PrincipalStandard:
      const sAddress = deserializeAddress(bufferReader);
      return standardPrincipalCVFromAddress(sAddress);

    case ClarityType.PrincipalContract:
      const cAddress = deserializeAddress(bufferReader);
      const contractName = deserializeLPString(bufferReader);
      return contractPrincipalCVFromAddress(cAddress, contractName);

    case ClarityType.ResponseOk:
      return responseOkCV(deserializeCV(bufferReader));

    case ClarityType.ResponseErr:
      return responseErrorCV(deserializeCV(bufferReader));

    case ClarityType.OptionalNone:
      return noneCV();

    case ClarityType.OptionalSome:
      return someCV(deserializeCV(bufferReader));

    case ClarityType.List:
      const listLength = bufferReader.readUInt32BE();
      const listContents: ClarityValue[] = [];
      for (let i = 0; i < listLength; i++) {
        listContents.push(deserializeCV(bufferReader));
      }
      return listCV(listContents);

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
      return tupleCV(tupleContents);

    case ClarityType.StringASCII:
      const asciiStrLen = bufferReader.readUInt32BE();
      const asciiStr = bufferReader.readBuffer(asciiStrLen).toString('ascii');
      return stringAsciiCV(asciiStr);

    case ClarityType.StringUTF8:
      const utf8StrLen = bufferReader.readUInt32BE();
      const utf8Str = bufferReader.readBuffer(utf8StrLen).toString('utf8');
      return stringUtf8CV(utf8Str);

    default:
      throw new DeserializationError(
        'Unable to deserialize Clarity Value from buffer. Could not find valid Clarity Type.'
      );
  }
}
