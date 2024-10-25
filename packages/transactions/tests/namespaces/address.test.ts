import { Address } from '../../src';

describe('Address Namespace', () => {
  describe(Address.parse, () => {
    it('should parse addresses correctly', () => {
      const address = Address.parse('SP000000000000000000002Q6VF78');
      expect(address).toEqual({ version: 22, versionChar: 'P', hash160: '0'.repeat(40) });

      const addressWithVersionChar = Address.parse('SP000000000000000000002Q6VF78');
      expect(addressWithVersionChar).toEqual({
        version: 22,
        versionChar: 'P',
        hash160: '0'.repeat(40),
      });

      const addressWithContractId = Address.parse('ST000000000000000000002AMW42H.pox');
      expect(addressWithContractId).toEqual({
        version: 26,
        versionChar: 'T',
        hash160: '0'.repeat(40),
        contractName: 'pox',
      });
    });

    it('should throw an error for invalid addresses', () => {
      expect(() => Address.parse('invalid')).toThrow('Invalid c32 address: must start with "S"');
    });

    it('should throw an error for checksum mismatches', () => {
      expect(() => Address.parse('ST000BLABLA')).toThrow(
        'Invalid c32check string: checksum mismatch'
      );
    });
  });

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
      expect(addressWithContractId).toBe('ST000000000000000000002AMW42H.pox');
    });
  });

  describe(Address.fromPrivateKey, () => {
    it('should return the correct address', () => {
      const address = Address.fromPrivateKey(
        '73a2f291df5a8ce3ceb668a25ac7af45639513af7596d710ddf59f64f484fd2801'
      );
      expect(address).toBe('SP10J81WVGVB3M4PHQN4Q4G0R8586TBJH948RESDR');

      const addressTestnet = Address.fromPrivateKey(
        '73a2f291df5a8ce3ceb668a25ac7af45639513af7596d710ddf59f64f484fd2801',
        'testnet'
      );
      expect(addressTestnet).toBe('ST10J81WVGVB3M4PHQN4Q4G0R8586TBJH94CGRESQ');
    });
  });

  describe(Address.fromPublicKey, () => {
    it('should return the correct address', () => {
      const address = Address.fromPublicKey(
        '0316e35d38b52d4886e40065e4952a49535ce914e02294be58e252d1998f129b19'
      );
      expect(address).toBe('SP10J81WVGVB3M4PHQN4Q4G0R8586TBJH948RESDR');

      const addressTestnet = Address.fromPublicKey(
        '0316e35d38b52d4886e40065e4952a49535ce914e02294be58e252d1998f129b19',
        'testnet'
      );
      expect(addressTestnet).toBe('ST10J81WVGVB3M4PHQN4Q4G0R8586TBJH94CGRESQ');
    });
  });
});
