import { ClarityType } from '../constants';

interface StringAsciiCV {
  readonly type: ClarityType.StringASCII;
  readonly data: string;
}

interface StringUtf8CV {
  readonly type: ClarityType.StringUTF8;
  readonly data: string;
}

/**
 * Converts ClarityValue to stringAsciiCV
 *
 * @param {data} ClarityValue value to be converted to stringAsciiCV clarity type
 *
 * @returns {StringAsciiCV} returns instance of type StringAsciiCV
 *
 * @example
 * ```
 *  import { stringAsciiCV } from '@stacks/transactions';
 *
 *  const stringAscii = stringAsciiCV('test');
 *
 *  // { type: 13, data: 'hello' }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const stringAsciiCV = (data: string): StringAsciiCV => {
  return { type: ClarityType.StringASCII, data };
};

/**
 * Converts ClarityValue to stringUtf8CV
 *
 * @param {data} ClarityValue value to be converted to stringUtf8CV clarity type
 *
 * @returns {stringUtf8CV} returns instance of type stringUtf8CV
 *
 * @example
 * ```
 *  import { stringUtf8CV } from '@stacks/transactions';
 *
 *  const stringUTF8 = stringUtf8CV('test');
 *
 *  // { type: 13, data: 'hello' }
 * ```
 *
 * @see
 * {@link https://github.com/hirosystems/stacks.js/blob/main/packages/transactions/tests/clarity.test.ts | clarity test cases for more examples}
 */
const stringUtf8CV = (data: string): StringUtf8CV => {
  return { type: ClarityType.StringUTF8, data };
};

/**
 * @ignore
 */
const stringCV = (data: string, encoding: 'ascii' | 'utf8'): StringAsciiCV | StringUtf8CV => {
  switch (encoding) {
    case 'ascii':
      return stringAsciiCV(data);
    case 'utf8':
      return stringUtf8CV(data);
  }
};

export { StringAsciiCV, StringUtf8CV, stringAsciiCV, stringUtf8CV, stringCV };
