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

/**
 * Create a null clarity type
 **
 * @returns {NoneCV} returns instance of type NoneCV
 *
 * @example
 * ```
 *  import { noneCV } from '@stacks/transactions';
 *
 *  const value = noneCV();
 *  // { type: 9 }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function noneCV(): NoneCV {
  return { type: ClarityType.OptionalNone };
}

/**
 * Converts any ClarityValue in to OptionalCV clarity type
 *
 * @param {ClarityValue} value to be converted to OptionalCV clarity type
 *
 * @returns {OptionalCV} returns instance of type OptionalCV
 *
 * @example
 * ```
 *  import { someCV, trueCV } from '@stacks/transactions';
 *
 *  const value = someCV(trueCV());
 *  // { type: 10, value: { type: 3 } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
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
