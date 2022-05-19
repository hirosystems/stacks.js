import { parseRecoverableSignatureVrs, signatureRsvToVrs, signatureVrsToRsv } from '../src';

test('parseRecoverableSignatureVrs', () => {
  const signatureHex = `01${'r'.repeat(64)}${'s'.repeat(64)}`;

  const parsed = parseRecoverableSignatureVrs(signatureHex);

  expect(parsed.recoveryId).toBe(1);
  expect(parsed.r).toBe('r'.repeat(64));
  expect(parsed.s).toBe('s'.repeat(64));

  expect(() => parseRecoverableSignatureVrs('short')).toThrow('Invalid signature');
});

test('signatureVrsToRsv <> signatureRsvToVrs', () => {
  expect(signatureVrsToRsv('VVRRRSSS')).toBe('RRRSSSVV');
  expect(signatureRsvToVrs('RRRSSSVV')).toBe('VVRRRSSS');
});
