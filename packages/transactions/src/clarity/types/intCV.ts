import { IntegerType, intToBigInt } from '@stacks/common';
import { ClarityType } from '../constants';

const MAX_U128 = BigInt('0xffffffffffffffffffffffffffffffff'); // (2 ** 128 - 1)
const MIN_U128 = BigInt(0);
const MAX_I128 = BigInt('0x7fffffffffffffffffffffffffffffff'); // (2 ** 127 - 1)
// no signed (negative) hex support in bigint constructor
const MIN_I128 = BigInt('-170141183460469231731687303715884105728'); // (-2 ** 127)

interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: bigint;
}

/**
 * Converts IntegerType in to IntCV clarity type
 *
 * @param {value} integer value to be converted to IntCV clarity type
 *
 * @returns {IntCV} returns instance of type IntCV
 *
 * @example
 * ```
 *  import { intCV } from '@stacks/transactions';
 *
 *  const value = intCV('100'); // parameter any of type: number | string | bigint | Uint8Array | BN
 *  // { type: 0, value: 100n }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const intCV = (value: IntegerType): IntCV => {
  const bigInt = intToBigInt(value, true);
  if (bigInt > MAX_I128) {
    throw new RangeError(`Cannot construct clarity integer from value greater than ${MAX_I128}`);
  } else if (bigInt < MIN_I128) {
    throw new RangeError(`Cannot construct clarity integer form value less than ${MIN_I128}`);
  }
  return { type: ClarityType.Int, value: bigInt };
};

interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: bigint;
}

/**
 * Converts IntegerType in to IntCV clarity type
 *
 * @param {value} integer value to be converted to UIntCV clarity type (Only unsigned integer is allowed otherwise throws exception)
 *
 * @returns {UIntCV} returns instance of type UIntCV
 *
 * @example
 * ```
 *  import { uintCV } from '@stacks/transactions';
 *
 *  const value = uintCV('100'); // parameter any of type: number | string | bigint | Uint8Array | BN
 *  // { type: 1, value: 100n }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const uintCV = (value: IntegerType): UIntCV => {
  const bigInt = intToBigInt(value, false);
  if (bigInt < MIN_U128) {
    throw new RangeError('Cannot construct unsigned clarity integer from negative value');
  } else if (bigInt > MAX_U128) {
    throw new RangeError(`Cannot construct unsigned clarity integer greater than ${MAX_U128}`);
  }
  return { type: ClarityType.UInt, value: bigInt };
};

export { IntCV, UIntCV, intCV, uintCV };
