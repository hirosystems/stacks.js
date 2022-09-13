import { hexToBytes } from '@stacks/common';
import { rightPad } from '../src/utils';

test('rightPad', () => {
  const arrLen4 = hexToBytes('00'.repeat(4));
  expect(rightPad(arrLen4, 32).length).toBe(32);
  expect(rightPad(arrLen4, 57).length).toBe(57);

  const arrLen32 = hexToBytes('00'.repeat(32));
  expect(rightPad(arrLen4, 32)).toEqual(arrLen32);
  expect(rightPad(arrLen32, 32)).toBe(arrLen32);

  expect(rightPad(hexToBytes('001122'), 4)).toEqual(hexToBytes('00112200'));
  expect(rightPad(hexToBytes('00112233'), 4)).toEqual(hexToBytes('00112233'));
  expect(rightPad(hexToBytes('0011223344'), 4)).toEqual(hexToBytes('0011223344'));

  expect(rightPad(hexToBytes('0011223344'), -1)).toEqual(hexToBytes('0011223344'));
});
