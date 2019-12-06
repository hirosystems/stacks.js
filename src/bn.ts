/* eslint-disable max-len */
/* eslint-disable no-useless-constructor */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-useless-constructor */


// TODO: This is terrible, hacky method to declare the class definition for `bn.js` 
//       in a way that prevents `@types/bn.js` from causing issues in other libs. The 
//       `@types/bn.js` package is improperly typed and requires `syntheticDefaultImports` 
//       or `skipLibCheck` to be enabled on consumer packages. 
//       This should be replaced with a PR to fix the `@types/bn.js` code.  


// @ts-ignore ts(2497): "This module can only be referenced with ECMAScript imports/exports by turning on the 'esModuleInterop' flag and referencing its default export."
import * as BN_Borked from 'bn.js'

export type Endianness = 'le' | 'be';

const BadTypeUsage = new Error('Class only used as an interface')


class BNClass {
  constructor(number: number | string | number[] | Uint8Array | Buffer | BNClass, endian?: Endianness);
  constructor(number: number | string | number[] | Uint8Array | Buffer | BNClass, base?: number | 'hex', endian?: Endianness);
  constructor(...args: any[]) { throw BadTypeUsage }

  /**
   * @description  convert to byte Array, and optionally zero pad to length, throwing if already exceeding
   */
  toArray(endian?: Endianness, length?: number): number[] { throw BadTypeUsage }

  /**
   * @description  convert to base-string and pad with zeroes
   */
  toString(base?: number | 'hex', length?: number): string { throw BadTypeUsage }

  /**
   * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
   */
  ucmp(b: BNClass): -1 | 0 | 1 { throw BadTypeUsage }

  /**
   * @description convert to Javascript Number (limited to 53 bits)
   */
  toNumber(): number { throw BadTypeUsage }

  /**
   * @description raise `a` to the power of `b`
   */
  pow(b: BNClass): BNClass { throw BadTypeUsage }

  /**
   * @description multiply
   */
  mul(b: BNClass): BNClass { throw BadTypeUsage }

  /**
   * @description addition
   */
  add(b: BNClass): BNClass { throw BadTypeUsage }
}

export const BNConstructor: typeof BNClass = BN_Borked as any
export type BN = BNClass
