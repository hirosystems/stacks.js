import { SmartBuffer, SmartBufferOptions } from 'smart-buffer';

function createEnumChecker<T extends string, TEnumValue extends number>(
  enumVariable: { [key in T]: TEnumValue }
): (value: number) => value is TEnumValue {
  // Create a set of valid enum number values.
  const enumValues = Object.values<number>(enumVariable).filter(v => typeof v === 'number');
  const enumValueSet = new Set<number>(enumValues);
  return (value: number): value is TEnumValue => enumValueSet.has(value);
}

// eslint-disable-next-line @typescript-eslint/ban-types
const enumCheckFunctions = new Map<object, (value: number) => boolean>();

/**
 * Type guard to check if a given value is a valid enum value.
 * @param enumVariable - Literal `enum` type.
 * @param value - A value to check against the enum's values.
 * @example
 * ```ts
 * enum Color {
 *   Purple = 3,
 *   Orange = 5
 * }
 * const val: number = 3;
 * if (isEnum(Color, val)) {
 *   // `val` is known as enum type `Color`, e.g.:
 *   const colorVal: Color = val;
 * }
 * ```
 */
export function isEnum<T extends string, TEnumValue extends number>(
  enumVariable: { [key in T]: TEnumValue },
  value: number
): value is TEnumValue {
  const checker = enumCheckFunctions.get(enumVariable);
  if (checker !== undefined) {
    return checker(value);
  }
  const newChecker = createEnumChecker(enumVariable);
  enumCheckFunctions.set(enumVariable, newChecker);
  return isEnum(enumVariable, value);
}

export class BufferReader extends SmartBuffer {
  static fromBuffer(buffer: Buffer): BufferReader {
    return new BufferReader({ buff: buffer });
  }

  constructor(options?: SmartBufferOptions | Buffer) {
    if (Buffer.isBuffer(options)) {
      super({ buff: options });
    } else {
      super(options);
    }
  }

  readBigUIntLE(length: number): bigint {
    const buffer = Buffer.from(this.readBuffer(length)).reverse();
    const hex = buffer.toString('hex');
    const num = BigInt(`0x${hex}`);
    return num;
  }

  readBigUIntBE(length: number): bigint {
    const buffer = this.readBuffer(length);
    const hex = buffer.toString('hex');
    const num = BigInt(`0x${hex}`);
    return num;
  }

  readUInt8Enum<T extends string, TEnumValue extends number>(
    enumVariable: { [key in T]: TEnumValue },
    invalidEnumErrorFormatter: (val: number) => Error
  ): TEnumValue {
    const num = this.readUInt8();
    if (isEnum(enumVariable, num)) {
      return num;
    } else {
      throw invalidEnumErrorFormatter(num);
    }
  }
}
