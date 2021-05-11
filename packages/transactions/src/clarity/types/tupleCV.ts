import { ClarityType, ClarityValue } from '../clarityValue';
import { isClarityName } from '../../utils';

type TupleData<T extends ClarityValue = ClarityValue> = { [key: string]: T };

interface TupleCV<T extends TupleData = TupleData> {
  type: ClarityType.Tuple;
  data: T;
}

function tupleCV<T extends ClarityValue = ClarityValue>(data: TupleData<T>): TupleCV<TupleData<T>> {
  for (const key in data) {
    if (!isClarityName(key)) {
      throw new Error(`"${key}" is not a valid Clarity name`);
    }
  }

  return { type: ClarityType.Tuple, data };
}

export { TupleCV, tupleCV };
