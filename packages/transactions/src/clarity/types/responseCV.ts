import { ClarityType, ClarityValue } from '../clarityValue';

type ResponseCV = ResponseErrorCV | ResponseOkCV;

interface ResponseErrorCV {
  readonly type: ClarityType.ResponseErr;
  readonly value: ClarityValue;
}

interface ResponseOkCV {
  readonly type: ClarityType.ResponseOk;
  readonly value: ClarityValue;
}

function responseErrorCV(value: ClarityValue): ResponseErrorCV {
  return { type: ClarityType.ResponseErr, value };
}

function responseOkCV(value: ClarityValue): ResponseOkCV {
  return { type: ClarityType.ResponseOk, value };
}

export { ResponseCV, ResponseErrorCV, ResponseOkCV, responseErrorCV, responseOkCV };
