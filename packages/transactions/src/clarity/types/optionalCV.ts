import { ClarityValue } from '../clarityValue';
import { ClarityType } from '../constants';
type OptionalCV<T extends ClarityValue = ClarityValue> = NoneCV | SomeCV<T>;

interface NoneCV {
  readonly type: ClarityType.OptionalNone;
}

interface SomeCV<T extends ClarityValue = ClarityValue> {
  readonly type: ClarityType.OptionalSome;
  readonly value: T;
}

function noneCV(): NoneCV {
  return { type: ClarityType.OptionalNone };
}

function someCV<T extends ClarityValue = ClarityValue>(value: T): OptionalCV<T> {
  return { type: ClarityType.OptionalSome, value };
}

function optionalCVOf<T extends ClarityValue = ClarityValue>(value?: T): OptionalCV<T> {
  if (value) {
    return someCV(value);
  } else {
    return noneCV();
  }
}

export { OptionalCV, NoneCV, SomeCV, noneCV, someCV, optionalCVOf };
