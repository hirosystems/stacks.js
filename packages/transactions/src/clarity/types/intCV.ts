import * as BigNum from 'bn.js';
import { CLARITY_INT_SIZE } from '../../constants';
import { ClarityType } from '../clarityValue';

interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: BigNum;
}

const intCV = (value: number | string | Buffer): IntCV => {
  const bn = new BigNum(value);
  const twos = bn.toTwos(CLARITY_INT_SIZE);

  if (twos.bitLength() > CLARITY_INT_SIZE) {
    throw new Error('Cannot construct clarity integer from value greater than INT_SIZE bits');
  }

  return { type: ClarityType.Int, value: twos };
};

interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: BigNum;
}

const uintCV = (value: number | string | Buffer): UIntCV => {
  const bn = new BigNum(value);
  const twos = bn.toTwos(CLARITY_INT_SIZE);

  if (twos.isNeg()) {
    throw new Error('Cannot construct unsigned clarity integer from negative value');
  } else if (twos.bitLength() > CLARITY_INT_SIZE) {
    throw new Error('Cannot construct unsigned clarity integer from value greater than 128 bits');
  }

  return { type: ClarityType.UInt, value: twos };
};

export { IntCV, UIntCV, intCV, uintCV };
