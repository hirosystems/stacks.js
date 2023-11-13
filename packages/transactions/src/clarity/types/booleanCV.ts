import { ClarityType } from '../constants';

export type BooleanCV = TrueCV | FalseCV;

export interface TrueCV {
  type: ClarityType.BoolTrue;
}

export interface FalseCV {
  type: ClarityType.BoolFalse;
}

/**
 * Converts true to BooleanCV clarity type
 * @returns returns instance of type BooleanCV
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
export const trueCV = (): BooleanCV => ({ type: ClarityType.BoolTrue });

/**
 * Converts false to BooleanCV clarity type
 * @returns returns instance of type BooleanCV
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
export const falseCV = (): BooleanCV => ({ type: ClarityType.BoolFalse });

/**
 * Converts a boolean to BooleanCV clarity type
 * @returns returns instance of type BooleanCV
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
export const boolCV = (bool: boolean) => (bool ? trueCV() : falseCV());
