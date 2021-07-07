import { IntegerType, intToBigInt } from '@stacks/common';
import { ClarityType } from '../clarityValue';

const MAX_U128 = BigInt(2) ** BigInt(128) - BigInt(1);
const MIN_U128 = BigInt(0);
const MAX_I128 = BigInt(2) ** BigInt(127) - BigInt(1);
const MIN_I128 = BigInt(-2) ** BigInt(127);

interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: bigint;
}

const intCV = (value: IntegerType): IntCV => {
  const bigInt = intToBigInt(value, true);
  if (bigInt > MAX_I128) {
    throw new RangeError(
      `Cannot construct clarity integer from value greater than ${MAX_I128.toString()}`
    );
  } else if (bigInt < MIN_I128) {
    throw new RangeError(
      `Cannot construct clarity integer form value less than ${MIN_I128.toString()}`
    );
  }
  return { type: ClarityType.Int, value: bigInt };
};

interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: bigint;
}

const uintCV = (value: IntegerType): UIntCV => {
  const bigInt = intToBigInt(value, false);
  if (bigInt < MIN_U128) {
    throw new RangeError('Cannot construct unsigned clarity integer from negative value');
  } else if (bigInt > MAX_U128) {
    throw new RangeError(
      `Cannot construct unsigned clarity integer greater than ${MAX_U128.toString()}`
    );
  }
  return { type: ClarityType.UInt, value: bigInt };
};

export { IntCV, UIntCV, intCV, uintCV };
