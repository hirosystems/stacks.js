import { ClarityValue, ClarityType } from '../clarityValue';

interface ListCV {
  type: ClarityType.List;
  list: ClarityValue[];
}

function listCV<T extends ClarityValue>(values: T[]): ListCV {
  return { type: ClarityType.List, list: values };
}

export { ListCV, listCV };
