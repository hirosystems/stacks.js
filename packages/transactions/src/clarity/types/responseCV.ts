import { ClarityValue } from '../clarityValue';
import { ClarityType } from '../constants';

type ResponseCV = ResponseErrorCV | ResponseOkCV;

interface ResponseErrorCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseErr;
  readonly value: T;
}

interface ResponseOkCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.ResponseOk;
  readonly value: T;
}

function responseErrorCV<T extends ClarityValue = ClarityValue>(value: T): ResponseErrorCV<T> {
  return { type: ClarityType.ResponseErr, value };
}

function responseOkCV<T extends ClarityValue = ClarityValue>(value: T): ResponseOkCV<T> {
  return { type: ClarityType.ResponseOk, value };
}

export { ResponseCV, ResponseErrorCV, ResponseOkCV, responseErrorCV, responseOkCV };
