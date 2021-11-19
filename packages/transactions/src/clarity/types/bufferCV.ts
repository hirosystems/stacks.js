import { Buffer } from '@stacks/common';
import { ClarityType } from '../constants';

interface BufferCV {
  readonly type: ClarityType.Buffer;
  readonly buffer: Buffer;
}

const bufferCV = (buffer: Buffer): BufferCV => {
  if (buffer.length > 1000000) {
    throw new Error('Cannot construct clarity buffer that is greater than 1MB');
  }

  return { type: ClarityType.Buffer, buffer };
};

const bufferCVFromString = (str: string): BufferCV => bufferCV(Buffer.from(str));

export { BufferCV, bufferCV, bufferCVFromString };
