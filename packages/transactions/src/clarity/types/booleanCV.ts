import { ClarityType } from '../constants';

type BooleanCV = TrueCV | FalseCV;

interface TrueCV {
  type: ClarityType.BoolTrue;
}

interface FalseCV {
  type: ClarityType.BoolFalse;
}

const trueCV = (): BooleanCV => ({ type: ClarityType.BoolTrue });
const falseCV = (): BooleanCV => ({ type: ClarityType.BoolFalse });

export { BooleanCV, TrueCV, FalseCV, trueCV, falseCV };
