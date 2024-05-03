import { utf8ToBytes } from '@stacks/common';
import { Cl, encodeAbiClarityValue, encodeClarityValue } from '../src';

const TEST_CASES = [
  {
    type: { optional: 'principal' },
    value: 'ST000000000000000000002AMW42H',
    expected: Cl.some(Cl.address('ST000000000000000000002AMW42H')),
  },
  {
    type: { optional: 'uint128' },
    value: '1000',
    expected: Cl.some(Cl.uint(1000n)),
  },
  {
    type: 'trait_reference',
    value: 'ST000000000000000000002AMW42H.trait',
    expected: Cl.address('ST000000000000000000002AMW42H.trait'),
  },
  {
    type: 'bool',
    value: 'true',
    expected: Cl.bool(true),
  },
  {
    type: 'bool',
    value: 'false',
    expected: Cl.bool(false),
  },
  {
    type: 'int128',
    value: '-42',
    expected: Cl.int(-42n),
  },
  {
    type: 'uint128',
    value: '17',
    expected: Cl.uint(17n),
  },
  {
    type: { buffer: { length: 10 } },
    value: 'beef',
    expected: Cl.buffer(utf8ToBytes('beef')), // legacy behavior
  },
  {
    type: 'principal',
    value: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS',
    expected: Cl.principal('ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS'),
  },
  {
    type: 'principal',
    value: 'ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS.contract-name',
    expected: Cl.contractPrincipal('ST1J28031BYDX19TYXSNDG9Q4HDB2TBDAM921Y7MS', 'contract-name'),
  },
] as const;

test.each(TEST_CASES)(encodeClarityValue.name, ({ type, value, expected }) => {
  const result = encodeClarityValue(type, value);
  expect(result).toEqual(expected);
});

test(encodeAbiClarityValue.name, () => {
  // buffer is expected to be hex

  const resultA = encodeAbiClarityValue('beef', { buffer: { length: 10 } });
  expect(resultA).toEqual(Cl.bufferFromHex('beef'));

  const resultB = encodeAbiClarityValue('0xbeef', { buffer: { length: 10 } });
  expect(resultB).toEqual(Cl.bufferFromHex('beef'));

  TEST_CASES.filter((tc: any) => !tc.type.buffer).forEach(({ type, value, expected }) => {
    const result = encodeAbiClarityValue(value, type);
    expect(result).toEqual(expected);
  });
});
