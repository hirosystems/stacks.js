import { Buffer } from '@stacks/common';
import { ClarityType } from '../constants';

interface BufferCV {
  readonly type: ClarityType.Buffer;
  readonly buffer: Buffer;
}

/**
 * Converts a buffer to BufferCV clarity type
 *
 * @param {buffer} buffer value to be converted to clarity type
 *
 * @returns {BufferCV} returns instance of type BufferCV
 *
 * @example
 * ```
 *  import { bufferCV } from '@stacks/transactions';
 *
 *  const buffer = Buffer.from('this is a test');
 *  const buf = bufferCV(buffer);
 *  // { type: 2, buffer: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74> }
 *  const value = buf.buffer.toString();
 *  // this is a test
 * ```
 *
 * @visit
 * {@link https://github.com/hirosystems/stacks.js/blob/master/packages/transactions/tests/clarity.test.ts clarity test cases for more examples}
 */
const bufferCV = (buffer: Buffer): BufferCV => {
  if (buffer.length > 1000000) {
    throw new Error('Cannot construct clarity buffer that is greater than 1MB');
  }

  return { type: ClarityType.Buffer, buffer };
};

/**
 * Converts a string to BufferCV clarity type
 *
 * @param {str} string input to be converted to bufferCV clarity type
 *
 * @returns {BufferCV} returns instance of type BufferCV
 *
 * @example
 * ```
 *  import { bufferCVFromString } from '@stacks/transactions';
 *
 *  const str = 'this is a test';
 *  const buf = bufferCVFromString(str);
 *  // { type: 2, buffer: <Buffer 74 68 69 73 20 69 73 20 61 20 74 65 73 74> }
 *  const value = buf.buffer.toString();
 *  // this is a test
 *```
 *
 * @visit
 * {@link https://github.com/hirosystems/stacks.js/blob/master/packages/transactions/tests/clarity.test.ts clarity test cases for more examples}
 */
const bufferCVFromString = (str: string): BufferCV => bufferCV(Buffer.from(str));

export { BufferCV, bufferCV, bufferCVFromString };
