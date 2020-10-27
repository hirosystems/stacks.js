import { ClarityType } from '../clarityValue';

interface StringAsciiCV {
  readonly type: ClarityType.StringASCII;
  readonly data: string;
}

interface StringUtf8CV {
  readonly type: ClarityType.StringUTF8;
  readonly data: string;
}

const stringAsciiCV = (data: string): StringAsciiCV => {
  return { type: ClarityType.StringASCII, data };
};

const stringUtf8CV = (data: string): StringUtf8CV => {
  return { type: ClarityType.StringUTF8, data };
};

const stringCV = (data: string, encoding: 'ascii' | 'utf8'): StringAsciiCV | StringUtf8CV => {
  switch (encoding) {
    case 'ascii':
      return stringAsciiCV(data);
    case 'utf8':
      return stringAsciiCV(data);
  }
};

export { StringAsciiCV, StringUtf8CV, stringAsciiCV, stringUtf8CV, stringCV };
