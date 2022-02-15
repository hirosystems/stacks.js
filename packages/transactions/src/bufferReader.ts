import { Buffer } from '@stacks/common';
import { SmartBuffer, SmartBufferOptions } from 'smart-buffer';

function createEnumChecker<T extends string, TEnumValue extends number>(enumVariable: {
  [key in T]: TEnumValue;
}): (value: number) => value is TEnumValue {
  // Create a set of valid enum number values.
  const enumValues = Object.values<number>(enumVariable).filter(v => typeof v === 'number');
  const enumValueSet = new Set<number>(enumValues);
  return (value: number): value is TEnumValue => enumValueSet.has(value);
}

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

export class BufferReader {
  smartBuffer: SmartBuffer;

  static fromBuffer(buffer: Buffer): BufferReader {
    return new BufferReader({ buff: buffer });
  }

  constructor(options?: SmartBufferOptions | Buffer) {
    if (Buffer.isBuffer(options)) {
      this.smartBuffer = new SmartBuffer({ buff: options });
    } else {
      this.smartBuffer = new SmartBuffer(options);
    }
  }

  readBuffer(length: number): Buffer {
    return this.smartBuffer.readBuffer(length);
  }

  readUInt32BE(offset?: number): number {
    return this.smartBuffer.readUInt32BE(offset);
  }

  readUInt8(): number {
    return this.smartBuffer.readUInt8();
  }

  readUInt16BE(): number {
    return this.smartBuffer.readUInt16BE();
  }

  readBigUIntLE(length: number): bigint {
    const buffer = Buffer.from(this.smartBuffer.readBuffer(length)).reverse();
    const hex = buffer.toString();
    const num = BigInt(`0x${hex}`);
    return num;
  }

  readBigUIntBE(length: number): bigint {
    const buffer = this.smartBuffer.readBuffer(length);
    const hex = buffer.toString('hex');
    const num = BigInt(`0x${hex}`);
    return num;
  }

  readBigUInt64BE(): bigint {
    return this.smartBuffer.readBigUInt64BE();
  }

  readString(arg?: number | BufferEncoding, encoding?: BufferEncoding): string {
    return this.smartBuffer.readString(arg, encoding);
  }

  get readOffset(): number {
    return this.smartBuffer.readOffset;
  }

  set readOffset(val: number) {
    this.smartBuffer.readOffset = val;
  }

  get internalBuffer(): Buffer {
    return this.smartBuffer.internalBuffer;
  }

  readUInt8Enum<T extends string, TEnumValue extends number>(
    enumVariable: { [key in T]: TEnumValue },
    invalidEnumErrorFormatter: (val: number) => Error
  ): TEnumValue {
    const num = this.smartBuffer.readUInt8();
    if (isEnum(enumVariable, num)) {
      return num;
    } else {
      throw invalidEnumErrorFormatter(num);
    }
  }
}
