import { ClarityType } from '../constants';

type BooleanCV = TrueCV | FalseCV;

interface TrueCV {
  type: ClarityType.BoolTrue;
}

interface FalseCV {
  type: ClarityType.BoolFalse;
}

/**
 * Converts true to BooleanCV clarity type
 *
 * @returns {BooleanCV} returns instance of type BooleanCV
 *
 * @example
 * ```
 *  import { trueCV } from '@stacks/transactions';
 *
 *  const trueCV = trueCV();
 *  // { type: 3 }
 * ```
 *
 * @visit
 * {@link https://github.com/hirosystems/stacks.js/blob/master/packages/transactions/tests/clarity.test.ts clarity test cases for more examples}
 */
const trueCV = (): BooleanCV => ({ type: ClarityType.BoolTrue });

/**
 * Converts false to BooleanCV clarity type
 *
 * @returns {BooleanCV} returns instance of type BooleanCV
 *
 * @example
 * ```
 *  import { falseCV } from '@stacks/transactions';
 *
 *  const falseCV = falseCV();
 *  // { type: 4 }
 * ```
 *
 * @visit
 * {@link https://github.com/hirosystems/stacks.js/blob/master/packages/transactions/tests/clarity.test.ts clarity test cases for more examples}
 */
const falseCV = (): BooleanCV => ({ type: ClarityType.BoolFalse });

export { BooleanCV, TrueCV, FalseCV, trueCV, falseCV };
