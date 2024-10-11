import { Address } from '../../src';

describe('Address', () => {
  describe(Address.parse, () => {});

  describe(Address.stringify, () => {
    it('should return the correct address', () => {
      const addressWithVersion = Address.stringify({ version: 22, hash160: '0'.repeat(40) });
      expect(addressWithVersion).toBe('SP000000000000000000002Q6VF78');

      const addressWithVersionChar = Address.stringify({
        versionChar: 'P',
        hash160: '0'.repeat(40),
      });
      expect(addressWithVersionChar).toBe('SP000000000000000000002Q6VF78');

      const addressWithContractId = Address.stringify({
        versionChar: 'T',
        hash160: '0'.repeat(40),
        contractName: 'pox',
      });
      expect(addressWithContractId).toBe('ST000000000000000000002Q6VF78.pox');
    });
  });
});
