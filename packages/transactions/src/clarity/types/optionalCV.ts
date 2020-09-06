import { ClarityType, ClarityValue } from '../clarityValue';

type OptionalCV = NoneCV | SomeCV;

interface NoneCV {
  readonly type: ClarityType.OptionalNone;
}

interface SomeCV {
  readonly type: ClarityType.OptionalSome;
  readonly value: ClarityValue;
}

const noneCV = (): OptionalCV => ({ type: ClarityType.OptionalNone });
const someCV = (value: ClarityValue): OptionalCV => ({ type: ClarityType.OptionalSome, value });
const optionalCVOf = (value?: ClarityValue): OptionalCV => {
  if (value) {
    return someCV(value);
  } else {
    return noneCV();
  }
};

export { OptionalCV, noneCV, someCV, optionalCVOf };
