import { ClarityType, ClarityValue } from '../clarityValue';
import { isClarityName } from '../../utils';

type TupleData = { [key: string]: ClarityValue };

interface TupleCV {
  type: ClarityType.Tuple;
  data: TupleData;
}

function tupleCV(data: TupleData): TupleCV {
  for (const key in data) {
    if (!isClarityName(key)) {
      throw new Error(`"${key}" is not a valid Clarity name`);
    }
  }

  return { type: ClarityType.Tuple, data };
}

export { TupleCV, tupleCV };
