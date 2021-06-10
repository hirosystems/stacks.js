import { Buffer } from '@stacks/common';
import BigNum from 'bn.js';
import { CLARITY_INT_SIZE } from '../../constants';
import { ClarityType } from '../clarityValue';

const MAX_U128 = new BigNum(2).pow(new BigNum(128)).subn(1);
const MAX_I128 = new BigNum(2).pow(new BigNum(127)).subn(1);
const MIN_I128 = new BigNum(-2).pow(new BigNum(127));

interface IntCV {
  readonly type: ClarityType.Int;
  readonly value: BigNum;
}

function valueToBN(value: unknown, signed: boolean): BigNum {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new TypeError(`Invalid value. Values of type 'number' must be an integer.`);
    }
    return new BigNum(value);
  }
  if (typeof value === 'string') {
    // If hex string then convert to buffer then fall through to the buffer condition
    if (value.toLowerCase().startsWith('0x')) {
      // Trim '0x' hex-prefix
      let hex = value.slice(2);
      // Allow odd-length strings like `0xf` -- some libs output these, or even just `0x${num.toString(16)}`
      hex = hex.padStart(hex.length + (hex.length % 2), '0');
      value = Buffer.from(hex, 'hex');
    } else {
      return new BigNum(value);
    }
  }
  if (typeof value === 'bigint') {
    return new BigNum(value.toString());
  }
  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    if (signed) {
      // Allow byte arrays smaller than 128-bits to be passed.
      // This allows positive signed ints like `0x08` (8) or negative signed
      // ints like `0xf8` (-8) to be passed without having to pad to 16 bytes.
      return new BigNum(value, 'be').fromTwos(value.byteLength * 8);
    } else {
      return new BigNum(value, 'be');
    }
  }
  if (value instanceof BigNum || BigNum.isBN(value)) {
    return value;
  }
  throw new TypeError(
    `Invalid value type. Must be a number, bigint, integer-string, hex-string, BN.js instance, or Buffer.`
  );
}

const intCV = (value: number | string | bigint | Uint8Array | BigNum): IntCV => {
  const bn = valueToBN(value, true);

  if (bn.gt(MAX_I128)) {
    throw new RangeError(
      `Cannot construct clarity integer from value greater than ${MAX_I128.toString()}`
    );
  } else if (bn.lt(MIN_I128)) {
    throw new RangeError(
      `Cannot construct clarity integer form value less than ${MIN_I128.toString()}`
    );
  } else if (bn.bitLength() > CLARITY_INT_SIZE) {
    throw new RangeError(
      `Cannot construct clarity integer from value greater than ${CLARITY_INT_SIZE} bits`
    );
  }

  return { type: ClarityType.Int, value: bn };
};

interface UIntCV {
  readonly type: ClarityType.UInt;
  readonly value: BigNum;
}

const uintCV = (value: number | string | bigint | Uint8Array | BigNum): UIntCV => {
  const bn = valueToBN(value, false);

  if (bn.isNeg()) {
    throw new RangeError('Cannot construct unsigned clarity integer from negative value');
  } else if (bn.gt(MAX_U128)) {
    throw new RangeError(
      `Cannot construct unsigned clarity integer greater than ${MAX_U128.toString()}`
    );
  } else if (bn.bitLength() > CLARITY_INT_SIZE) {
    throw new RangeError(
      `Cannot construct unsigned clarity integer from value greater than ${CLARITY_INT_SIZE} bits`
    );
  }

  return { type: ClarityType.UInt, value: bn };
};

export { IntCV, UIntCV, intCV, uintCV };
