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
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
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
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const falseCV = (): BooleanCV => ({ type: ClarityType.BoolFalse });

/**
 * Converts a boolean to BooleanCV clarity type
 *
 * @returns {BooleanCV} returns instance of type BooleanCV
 *
 * @example
 * ```
 *  import { boolCV } from '@stacks/transactions';
 *
 *  const boolCV = boolCV(false);
 *  // { type: 4 }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const boolCV = (bool: boolean) => (bool ? trueCV() : falseCV());

export { BooleanCV, TrueCV, FalseCV, boolCV, trueCV, falseCV };
