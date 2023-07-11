import { ClarityValue } from '../clarityValue';
import { ClarityType } from '../constants';
import { isClarityName } from '../../utils';

type TupleData<T extends ClarityValue = ClarityValue> = { [key: string]: T };

interface TupleCV<T extends TupleData = TupleData> {
  type: ClarityType.Tuple;
  data: T;
}

/**
 * Create tuple of clarity values
 *
 * @param {tupleData} tuple value to be converted to tuple of clarity types
 *
 * @returns {TupleCV} returns instance of type clarity tuple
 *
 * @example
 * ```
 *  import { tupleCV, trueCV, falseCV } from '@stacks/transactions';
 *
 *  const tuple = tupleCV({
 *    c: trueCV(),
 *    b: falseCV(),
 *    a: trueCV(),
 *  });
 *  // { type: 12, data: { c: { type: 3 }, b: { type: 4 }, a: { type: 3 } } }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
function tupleCV<T extends ClarityValue = ClarityValue>(data: TupleData<T>): TupleCV<TupleData<T>> {
  for (const key in data) {
    if (!isClarityName(key)) {
      throw new Error(`"${key}" is not a valid Clarity name`);
    }
  }

  return { type: ClarityType.Tuple, data };
}

export { TupleCV, tupleCV };
