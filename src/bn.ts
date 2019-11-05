/* eslint-disable max-len */
/* eslint-disable no-useless-constructor */
/* eslint-disable lines-between-class-members */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-useless-constructor */

// Do not export from the `@types/bn.js` package -- it is improperly typed and requires
// `syntheticDefaultImports` or `skipLibCheck` to be enabled on consumer packages. 

// @ts-ignore
import * as BN_Borked from 'bn.js'

export type Endianness = 'le' | 'be';

const BadTypeUsage = new Error('Class only used as an interface')

// TODO: This is terrible, hacky method to declare the class definition for `bn.js` lib
//       in a way that prevents `@types/bn.js` from publicly leaking from this this lib
//       and causing issues in other libs. This should be replaced with a PR to fix 
//       the `@types/bn.js` code.  

class BNClass {
  constructor(number: number | string | number[] | Uint8Array | Buffer | BNClass, endian?: Endianness);
  constructor(number: number | string | number[] | Uint8Array | Buffer | BNClass, base?: number | 'hex', endian?: Endianness);
  constructor(...args: any[]) { throw BadTypeUsage }

  /**
   * @description  convert to byte Array, and optionally zero pad to length, throwing if already exceeding
   */
  toArray(_endian?: Endianness, _length?: number): number[] { throw BadTypeUsage }

  /**
   * @description  convert to base-string and pad with zeroes
   */
  toString(_base?: number | 'hex', _length?: number): string { throw BadTypeUsage }

  /**
   * @description compare numbers and return `-1 (a < b)`, `0 (a == b)`, or `1 (a > b)` depending on the comparison result
   */
  ucmp(_b: BNClass): -1 | 0 | 1 { throw BadTypeUsage }

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
