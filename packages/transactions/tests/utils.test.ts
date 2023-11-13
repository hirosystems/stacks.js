import { validateStacksAddress } from '../src/utils';

describe(validateStacksAddress.name, () => {
  test('it returns true for a legit address', () => {
    const validAddresses = [
      'STVTVW5E80EET19EZ3J8W3NZKR6RHNFG58TKQGXH',
      'STMFBYXTWAZD0NYMHSRQBZX1190EMZ42VD326PNP',
      'ST22ENKAF6J5G43TZFQS1WTV0YEH8VNX2SX048RA5',
    ];
    validAddresses.forEach(address => expect(validateStacksAddress(address)).toBeTruthy());
  });

  test('it returns false for nonsense input', () => {
    const nonsenseNotRealSillyAddresses = [
      'update borrow transfer trumpet stem topic resemble youth trophy later slam air subway invite salt quantum fossil smoke hero lift sense boat green wave',
      '03680327df912362e7d2280fea0fb80af2ba70f8fdc853d36f3c621fb93a73b801',
      'one upon a time in a land far far away',
      'lkjsdfksfjd(*&(*7sedf;lkj',
      'In the beginning...',
      // missing one char
      'ST3S6T6BS4DJ7AW74KVMNYXWH5SZ1WXX8JBCYZVY',
    ];
    nonsenseNotRealSillyAddresses.forEach(nonAddress =>
      expect(validateStacksAddress(nonAddress)).toBeFalsy()
    );
  });
});
